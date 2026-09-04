const fs = require("fs");
const crypto = require("crypto");

const [archivePath, outputPath] = process.argv.slice(2);
if (!archivePath || !outputPath) {
  throw new Error("usage: node _patch_luna_runtime.cjs <archive> <output>");
}

function readAsarHeader(fd) {
  const prefix = Buffer.alloc(8);
  fs.readSync(fd, prefix, 0, 8, 0);
  const headerSize = prefix.readUInt32LE(4);
  const headerBuffer = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuffer, 0, headerSize, 8);
  const json = headerBuffer.subarray(8).toString("utf8").replace(/\0+$/g, "");
  return { prefix, headerSize, headerBuffer, header: JSON.parse(json), dataStart: 8 + headerSize };
}

function find(node, relative, result) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const current = relative ? `${relative}/${name}` : name;
    if (child.files) find(child, current, result);
    else if (!child.unpacked && child.offset !== undefined && child.size !== undefined) result[current] = child;
  }
}

const sourceFd = fs.openSync(archivePath, "r");
const { prefix, headerSize, header, dataStart } = readAsarHeader(sourceFd);
const entries = {};
find(header, "", entries);
const entry = entries["out/main/index.jsc"];
if (!entry) throw new Error("out/main/index.jsc is not a packed ASAR file");

const payload = Buffer.alloc(Number(entry.size));
fs.readSync(sourceFd, payload, 0, payload.length, dataStart + Number(entry.offset));
const replacementsSpec = [
  { old: Buffer.from("泰深", "utf16le"), next: Buffer.from("露娜", "utf16le") },
  // Keep the compiled string table byte-aligned; bootstrap enforces the full
  // runtime ID `com.luna.desktop` before the legacy bytecode executes.
  { old: Buffer.from("com.taishen.app"), next: Buffer.from("com.luna.app___") },
];
let replacements = 0;
for (const { old, next } of replacementsSpec) {
  for (let at = 0; (at = payload.indexOf(old, at)) >= 0; at += old.length) {
    next.copy(payload, at);
    replacements++;
  }
}
if (!replacements) throw new Error("No legacy Chinese brand strings found in index.jsc");

const digest = crypto.createHash("sha256").update(payload).digest("hex");
entry.integrity = { algorithm: "SHA256", hash: digest, blockSize: 4194304, blocks: [digest] };
const json = Buffer.from(JSON.stringify(header), "utf8");
if (json.length > headerSize - 8) throw new Error(`ASAR header grew from ${headerSize - 8} to ${json.length} bytes`);
const headerBuffer = Buffer.alloc(headerSize);
headerBuffer.writeUInt32LE(headerSize - 4, 0);
headerBuffer.writeUInt32LE(json.length, 4);
json.copy(headerBuffer, 8);

fs.copyFileSync(archivePath, outputPath);
const outputFd = fs.openSync(outputPath, "r+");
fs.writeSync(outputFd, prefix, 0, prefix.length, 0);
fs.writeSync(outputFd, headerBuffer, 0, headerBuffer.length, 8);
fs.writeSync(outputFd, payload, 0, payload.length, dataStart + Number(entry.offset));
fs.closeSync(outputFd);
fs.closeSync(sourceFd);
console.log(JSON.stringify({ archivePath, outputPath, replacements, bytes: payload.length }, null, 2));
