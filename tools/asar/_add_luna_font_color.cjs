const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('usage: node _add_luna_font_color.cjs <extracted-asar-root>');

const renderer = path.join(root, 'out/renderer/assets/index-BBAKMKgY.js');
const settings = path.join(root, 'out/renderer/assets/SettingsPage-4AAvyvnk.js');
const COLOR_KEY = 'luna.backgroundTextColor';
const COLOR_EVENT = 'luna-background-text-color-changed';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, text) { fs.writeFileSync(file, text); }
function once(text, oldText, newText, label) {
  const count = text.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, got ${count}`);
  return text.replace(oldText, newText);
}

function patchSettings() {
  let text = read(settings);
  if (text.includes('data-luna-text-color-picker')) {
    console.log('settings font color: already patched');
    return;
  }

  text = once(
    text,
    ',[H,me]=l.useState(1),[Y,ge]=l.useState("")',
    ',[H,me]=l.useState(1),[Y,ge]=l.useState(""),[LunaTextColor,setLunaTextColor]=l.useState("")',
    'settings font color state',
  );

  const opacityEffect = 'l.useEffect(()=>{window.api?.app?.getSetting?.("taishen.windowOpacity").then(s=>{const x=Number(s);if(Number.isFinite(x)){const k=Math.min(1,Math.max(.7,x));me(k),window.api?.window?.setOpacity?.(k)}}).catch(()=>{}),Promise.resolve()},[])';
  text = once(
    text,
    opacityEffect,
    `${opacityEffect},l.useEffect(()=>{window.api?.app?.getSetting?.("${COLOR_KEY}").then(s=>{const x=typeof s==="string"&&/^#[0-9a-f]{6}$/i.test(s)?s.toLowerCase():"";setLunaTextColor(x)}).catch(()=>{})},[])`,
    'settings font color loader',
  );

  const preview = 'Y&&e.jsx("img",{src:Y,alt:"\\u81EA\\u5B9A\\u4E49\\u4E3B\\u9898\\u9884\\u89C8",className:"mt-3 h-24 w-full rounded-lg border border-slate-200 object-cover"})';
  const picker = 'e.jsx("div",{id:"data-luna-text-color-picker",className:"mt-4"})';
  text = once(text, preview, `${preview},${picker}`, 'settings font color mount');

  const marker = 'l.useEffect(()=>{u==="network"&&(window.api.network.getRules().then(s=>de(s)),window.api.config.get().then(s=>{Ne(s.proxyUrl||""),ye(!!s.proxyEnabled)}))},[u]);';
  const effect = `l.useEffect(()=>{const e=document.getElementById("data-luna-text-color-picker");if(!e)return;const t=[['红','#ef4444'],['橙','#f97316'],['黄','#eab308'],['绿','#22c55e'],['蓝','#3b82f6'],['紫','#a855f7'],['白','#ffffff'],['黑','#111827']];e.innerHTML='<div class="mb-1 text-sm font-medium text-slate-700">主页面字体颜色</div><p class="mb-2 text-xs text-slate-400">上传自定义图片后生效，用于提高文字和按钮的可读性。</p><div data-luna-color-buttons class="flex flex-wrap gap-2"></div><div class="mt-2 flex items-center gap-2"><input data-luna-color-input type="color" value="'+(LunaTextColor||'#ffffff')+'" class="h-8 w-10 cursor-pointer rounded border border-slate-200"><span data-luna-color-value class="text-xs text-slate-500">'+(LunaTextColor||'未选择')+'</span></div>';const n=e.querySelector('[data-luna-color-buttons]'),o=e.querySelector('[data-luna-color-input]'),a=e.querySelector('[data-luna-color-value]'),s=v=>{if(!/^#[0-9a-f]{6}$/i.test(v))return;const x=v.toLowerCase();setLunaTextColor(x),o.value=x,a.textContent=x,window.api?.app?.setSetting?.("${COLOR_KEY}",x),window.dispatchEvent(new CustomEvent("${COLOR_EVENT}",{detail:{color:x}}));n.querySelectorAll('button').forEach(b=>b.style.outline=b.dataset.color===x?'2px solid currentColor':'none')};t.forEach(([v,x])=>{const b=document.createElement('button');b.type='button',b.dataset.color=x,b.title=v,b.textContent=v,b.style.cssText='padding:4px 9px;border-radius:6px;border:1px solid rgba(100,116,139,.35);font-size:12px;cursor:pointer;background:'+x+';color:'+(x==='#ffffff'?'#111827':'#fff'),b.onclick=()=>s(x),n.appendChild(b)}),o.oninput=()=>s(o.value),n.querySelectorAll('button').forEach(b=>b.style.outline=b.dataset.color===LunaTextColor?'2px solid currentColor':'none');return()=>{e.innerHTML=""}},[LunaTextColor,u,Y]);`;
  text = once(text, marker, `${marker}${effect}`, 'settings font color effect');
  write(settings, text);
  console.log('settings font color: patched');
}

function patchRenderer() {
  let text = read(renderer);
  if (!text.includes('id="luna-custom-background"')) throw new Error('renderer background layer not found');
  text = once(
    text,
    '},[E]),a.jsxs("div",{className:"px-5 pt-4 pb-1 relative"',
    '},[E]),a.jsxs("div",{"data-luna-composer":!0,className:"px-5 pt-4 pb-1 relative"',
    'chat composer marker',
  );
  text = once(
    text,
    'a.jsx("div",{className:"border-t border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed max-h-96 overflow-y-auto",children:a.jsx(b,{remarkPlugins:os,rehypePlugins:as,children:f||" "})})',
    'a.jsx("div",{"data-luna-thinking-content":!0,className:"border-t border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed max-h-96 overflow-y-auto",children:a.jsx(b,{remarkPlugins:os,rehypePlugins:as,children:f||" "})})',
    'thinking content marker',
  );
  const start = text.indexOf('n.useEffect(()=>{const e=document.createElement("div");e.id="luna-custom-background"');
  const endMarker = ';n.useEffect(()=>{const e=e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&"F"===e.key)';
  const end = text.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('renderer background effect boundaries not found');
  const effect = [
    'n.useEffect(()=>{const e=document.createElement("div");e.id="luna-custom-background",Object.assign(e.style,{position:"fixed",inset:"0",zIndex:"0",pointerEvents:"none",backgroundSize:"cover",backgroundPosition:"top center",backgroundRepeat:"no-repeat",backgroundAttachment:"fixed"}),document.body.prepend(e);',
    'const c=document.createElement("style");c.id="luna-background-contrast";c.textContent=\'[data-luna-bg] body,[data-luna-bg] body *{color:var(--luna-bg-text-color)!important;border-color:color-mix(in srgb,var(--luna-bg-text-color) 55%,transparent)!important;text-shadow:0 1px 3px rgba(0,0,0,.72)!important}[data-luna-bg] button,[data-luna-bg] [role="button"]{background-color:color-mix(in srgb,var(--luna-bg-text-color) 12%,rgba(15,23,42,.72))!important;color:var(--luna-bg-text-color)!important}[data-luna-bg] input,[data-luna-bg] textarea,[data-luna-bg] select{color:#111827!important;text-shadow:none!important;background-color:rgba(255,255,255,.92)!important;border-color:rgba(100,116,139,.45)!important}[data-luna-bg] aside,[data-luna-bg] nav,[data-luna-bg] [class*="sidebar"],[data-luna-bg] [class*="nav"]{background-color:color-mix(in srgb,var(--luna-bg-text-color) 10%,rgba(15,23,42,.62))!important}[data-luna-bg] svg{color:var(--luna-bg-text-color)!important;stroke:currentColor;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}[data-luna-bg] [data-luna-composer],[data-luna-bg] [data-luna-composer] *{color:#334155!important;text-shadow:none!important}[data-luna-bg] [data-luna-composer] button,[data-luna-bg] [data-luna-composer] [role="button"]{background-color:revert!important;border-color:revert!important;color:#475569!important}[data-luna-bg] [data-luna-composer] input,[data-luna-bg] [data-luna-composer] textarea,[data-luna-bg] [data-luna-composer] select{background-color:revert!important;border-color:revert!important;color:#334155!important}[data-luna-bg] [data-luna-composer] svg{color:#64748b!important;filter:none!important}[data-luna-bg] [data-luna-thinking-content],[data-luna-bg] [data-luna-thinking-content] *{color:#111827!important;text-shadow:none!important}\';document.head.append(c);',
    'let t=!1,n="";const o=/^#[0-9a-f]{6}$/i,a=()=>{const e=t?(o.test(n)?n:document.documentElement.dataset.lunaBg==="dark"?"#f8fafc":"#b42318"):"";e?document.documentElement.style.setProperty("--luna-bg-text-color",e):document.documentElement.style.removeProperty("--luna-bg-text-color")},s=d=>{if(!d){t=!1,e.style.backgroundImage="none",document.documentElement.removeAttribute("data-luna-bg"),a();return}t=!0;const n=new Image;n.onload=()=>{const o=document.createElement("canvas"),s=o.getContext("2d");o.width=1,o.height=1,s.drawImage(n,0,0,1,1);const i=s.getImageData(0,0,1,1).data,r=.299*i[0]+.587*i[1]+.114*i[2];document.documentElement.dataset.lunaBg=r<145?"dark":"light";const l=r<145?"rgba(255,255,255,.62)":"rgba(15,23,42,.52)";e.style.backgroundImage=`linear-gradient(${l},${l}),url(${d})`;a()},n.src=d};',
    `const i=e=>{n=e?.detail?.color||e?.detail||"",a()};window.addEventListener("luna-background-changed",e=>s(e.detail||"")),window.addEventListener("${COLOR_EVENT}",i),window.api?.app?.getSetting?.("${COLOR_KEY}").then(e=>{n=e||"",a()}).catch(()=>{});return()=>{e.remove(),c.remove(),window.removeEventListener("${COLOR_EVENT}",i),document.documentElement.style.removeProperty("--luna-bg-text-color"),document.documentElement.removeAttribute("data-luna-bg")}},[]);`,
  ].join('');
  text = text.slice(0, start) + effect + text.slice(end);
  write(renderer, text);
  console.log('renderer font color: patched');
}

patchSettings();
patchRenderer();
console.log(JSON.stringify({ colorKey: COLOR_KEY, colorEvent: COLOR_EVENT }));
