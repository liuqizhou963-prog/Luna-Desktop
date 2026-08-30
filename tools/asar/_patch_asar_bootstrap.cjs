const fs = require("fs");

const [archivePath, replacementPath, outputPath] = process.argv.slice(2);
if (!archivePath || !replacementPath || !outputPath) {
  throw new Error("usage: node _patch_asar_bootstrap.cjs <archive> <bootstrap> <output>");
}

const archive = fs.openSync(archivePath, "r");
const prefix = Buffer.alloc(8);
fs.readSync(archive, prefix, 0, prefix.length, 0);
const headerSize = prefix.readUInt32LE(4);
const headerBuffer = Buffer.alloc(headerSize);
fs.readSync(archive, headerBuffer, 0, headerBuffer.length, 8);
const headerText = headerBuffer.subarray(8).toString("utf8").replace(/\0+$/g, "");
const header = JSON.parse(headerText);
const dataStart = 8 + headerSize;

const packedFiles = [];
let bootstrapEntry;
function walk(node, relativePath) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const currentPath = relativePath ? `${relativePath}/${name}` : name;
    if (child.files) {
      walk(child, currentPath);
      continue;
    }
    if (!child.unpacked && child.size !== undefined && child.offset !== undefined) {
      const item = { path: currentPath, entry: child, offset: Number(child.offset), size: Number(child.size) };
      packedFiles.push(item);
      if (currentPath === "out/main/bootstrap.js") bootstrapEntry = item;
    }
  }
}
walk(header, "");
if (!bootstrapEntry) throw new Error("out/main/bootstrap.js is not a packed ASAR file");

const replacement = fs.readFileSync(replacementPath);
const delta = replacement.length - bootstrapEntry.size;
for (const item of packedFiles) {
  if (item.offset > bootstrapEntry.offset) item.entry.offset = String(item.offset + delta);
}
bootstrapEntry.entry.size = replacement.length;
bootstrapEntry.entry.integrity = {
  algorithm: "SHA256",
  hash: require("crypto").createHash("sha256").update(replacement).digest("hex"),
  blockSize: 4194304,
  blocks: [require("crypto").createHash("sha256").update(replacement).digest("hex")]
};

const json = Buffer.from(JSON.stringify(header), "utf8");
const newHeaderSize = 8 + json.length + ((4 - ((8 + json.length) % 4)) % 4);
console.log(JSON.stringify({ jsonLength: json.length, newHeaderSize }));
const newPrefix = Buffer.from(prefix);
newPrefix.writeUInt32LE(newHeaderSize, 4);
const newHeaderBuffer = Buffer.alloc(newHeaderSize);
headerBuffer.copy(newHeaderBuffer, 0, 0, 8);
newHeaderBuffer.writeUInt32LE(newHeaderSize - 4, 0);
newHeaderBuffer.writeUInt32LE(json.length, 4);
json.copy(newHeaderBuffer, 8);

const output = fs.openSync(outputPath, "w");
fs.writeSync(output, newPrefix);
fs.writeSync(output, newHeaderBuffer);
const beforeLength = bootstrapEntry.offset;
const afterStart = bootstrapEntry.offset + bootstrapEntry.size - delta;
const chunk = Buffer.allocUnsafe(1024 * 1024);
function copyRange(start, end) {
  let position = start;
  while (position < end) {
    const length = Math.min(chunk.length, end - position);
    fs.readSync(archive, chunk, 0, length, dataStart + position);
    fs.writeSync(output, chunk, 0, length);
    position += length;
  }
}
copyRange(0, beforeLength);
fs.writeSync(output, replacement);
const archiveSize = fs.fstatSync(archive).size;
copyRange(afterStart, archiveSize - dataStart);
fs.closeSync(output);
fs.closeSync(archive);
console.log(JSON.stringify({ archivePath, outputPath, oldHeaderSize: headerSize, newHeaderSize, oldBootstrapSize: bootstrapEntry.size - delta, newBootstrapSize: replacement.length, delta }, null, 2));
