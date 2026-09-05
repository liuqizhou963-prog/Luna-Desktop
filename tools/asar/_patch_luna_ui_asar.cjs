const fs = require("fs");
const crypto = require("crypto");

const [archivePath, extractedRoot, outputPath] = process.argv.slice(2);
if (!archivePath || !extractedRoot || !outputPath) {
  throw new Error("usage: node _patch_luna_ui_asar.cjs <archive> <extracted-root> <output>");
}

function loadHeader(fd) {
  const prefix = Buffer.alloc(8);
  fs.readSync(fd, prefix, 0, 8, 0);
  const headerSize = prefix.readUInt32LE(4);
  const headerBuffer = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuffer, 0, headerSize, 8);
  const jsonLength = headerBuffer.readUInt32LE(4);
  const json = headerBuffer.subarray(8, 8 + jsonLength).toString("utf8");
  return { prefix, headerSize, headerBuffer, header: JSON.parse(json), dataStart: 8 + headerSize };
}

function walk(node, relative, entries) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const current = relative ? `${relative}/${name}` : name;
    if (child.files) walk(child, current, entries);
    else if (!child.unpacked && child.offset !== undefined && child.size !== undefined) {
      entries[current] = child;
    }
  }
}

const sourceFd = fs.openSync(archivePath, "r");
const { prefix, headerSize, header, dataStart } = loadHeader(sourceFd);
const entries = {};
walk(header, "", entries);
const targets = [
  ["out/renderer/assets/index-BBAKMKgY.js", "out/renderer/assets/index-BBAKMKgY.js"],
  ["out/renderer/assets/SettingsPage-4AAvyvnk.js", "out/renderer/assets/SettingsPage-4AAvyvnk.js"],
].map(([archiveName, localName]) => {
  const entry = entries[archiveName];
  if (!entry) throw new Error(`Missing ASAR entry: ${archiveName}`);
  const replacement = fs.readFileSync(`${extractedRoot}/${localName}`);
  return { archiveName, entry, oldOffset: Number(entry.offset), oldSize: Number(entry.size), replacement };
});

targets.sort((a, b) => a.oldOffset - b.oldOffset);
let totalDelta = 0;
for (const target of targets) {
  target.newOffset = target.oldOffset + totalDelta;
  target.entry.offset = String(target.newOffset);
  target.entry.size = target.replacement.length;
  const hash = crypto.createHash("sha256").update(target.replacement).digest("hex");
  target.entry.integrity = { algorithm: "SHA256", hash, blockSize: 4194304, blocks: [hash] };
  const delta = target.replacement.length - target.oldSize;
  target.delta = delta;
  totalDelta += delta;
}
for (const child of Object.values(entries)) {
  if (targets.some((t) => t.entry === child)) continue;
  const oldOffset = Number(child.offset);
  const shift = targets.filter((t) => t.oldOffset < oldOffset).reduce((sum, t) => sum + t.delta, 0);
  child.offset = String(oldOffset + shift);
}

const json = Buffer.from(JSON.stringify(header), "utf8");
if (json.length > headerSize - 8) throw new Error(`ASAR header grew beyond reserved space: ${json.length}/${headerSize - 8}`);
const newHeader = Buffer.alloc(headerSize);
newHeader.writeUInt32LE(headerSize - 4, 0);
newHeader.writeUInt32LE(json.length, 4);
json.copy(newHeader, 8);

const outputFd = fs.openSync(outputPath, "w");
fs.writeSync(outputFd, prefix);
fs.writeSync(outputFd, newHeader);
const sourceSize = fs.fstatSync(sourceFd).size - dataStart;
const chunks = [];
let cursor = 0;
for (const target of targets) {
  const before = target.oldOffset;
  if (before > cursor) {
    const buffer = Buffer.alloc(before - cursor);
    fs.readSync(sourceFd, buffer, 0, buffer.length, dataStart + cursor);
    fs.writeSync(outputFd, buffer);
  }
  fs.writeSync(outputFd, target.replacement);
  cursor = target.oldOffset + target.oldSize;
}
if (cursor < sourceSize) {
  const buffer = Buffer.alloc(sourceSize - cursor);
  fs.readSync(sourceFd, buffer, 0, buffer.length, dataStart + cursor);
  fs.writeSync(outputFd, buffer);
}
fs.closeSync(outputFd);
fs.closeSync(sourceFd);
console.log(JSON.stringify({ archivePath, outputPath, totalDelta, targets: targets.map((t) => ({ path: t.archiveName, oldSize: t.oldSize, newSize: t.replacement.length, delta: t.delta })) }, null, 2));
