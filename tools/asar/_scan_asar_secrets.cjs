const fs = require("fs");

const archivePath = process.argv[2];
if (!archivePath) throw new Error("usage: node _scan_asar_secrets.cjs <archive>");
const patterns = [
  /sk-ant-[A-Za-z0-9_-]{20,}/g,
  /sk-proj-[A-Za-z0-9_-]{20,}/g,
  /sk-[A-Za-z0-9]{24,}/g,
  /AIza[0-9A-Za-z_-]{30,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /xox[baprs]-[A-Za-z0-9-]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
];
const fd = fs.openSync(archivePath, "r");
const prefix = Buffer.alloc(8);
fs.readSync(fd, prefix, 0, 8, 0);
const headerSize = prefix.readUInt32LE(4);
const headerBuffer = Buffer.alloc(headerSize);
fs.readSync(fd, headerBuffer, 0, headerSize, 8);
const header = JSON.parse(headerBuffer.subarray(8).toString("utf8").replace(/\0+$/g, ""));
const dataStart = 8 + headerSize;
let files = 0;
const hits = [];
function walk(node, relative) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const current = relative ? `${relative}/${name}` : name;
    if (child.files) walk(child, current);
    else if (!child.unpacked && child.offset !== undefined && child.size !== undefined) {
      files++;
      if (current.startsWith("node_modules/") || current.includes("/node_modules/") || current.startsWith("builtin-skills/.trash/") || current.includes("/builtin-skills/.trash/")) continue;
      const buffer = Buffer.alloc(Number(child.size));
      fs.readSync(fd, buffer, 0, buffer.length, dataStart + Number(child.offset));
      const text = buffer.toString("utf8");
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) { hits.push(current); break; }
      }
    }
  }
}
walk(header, "");
fs.closeSync(fd);
if (hits.length) {
  for (const hit of hits) console.error(`Potential credential found in ASAR: ${hit}`);
  process.exit(1);
}
console.log(`ASAR credential scan passed: ${files} packed files checked`);
