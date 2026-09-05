const fs = require('fs');
const path = require('path');

const [archive, destination] = process.argv.slice(2);
if (!archive || !destination) throw new Error('usage: node _extract_luna_ui_assets.cjs <app.asar> <destination>');

const fd = fs.openSync(archive, 'r');
const prefix = Buffer.alloc(8);
fs.readSync(fd, prefix, 0, 8, 0);
const headerSize = prefix.readUInt32LE(4);
const headerBuffer = Buffer.alloc(headerSize);
fs.readSync(fd, headerBuffer, 0, headerSize, 8);
const jsonLength = headerBuffer.readUInt32LE(4);
const header = JSON.parse(headerBuffer.subarray(8, 8 + jsonLength).toString('utf8'));
const dataStart = 8 + headerSize;

for (const relative of [
  'out/renderer/assets/index-BBAKMKgY.js',
  'out/renderer/assets/SettingsPage-4AAvyvnk.js',
]) {
  let node = header;
  for (const part of relative.split('/')) node = node.files[part];
  if (!node || node.unpacked) throw new Error(`packed ASAR entry not found: ${relative}`);
  const output = path.join(destination, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const content = Buffer.alloc(node.size);
  fs.readSync(fd, content, 0, node.size, dataStart + Number(node.offset));
  fs.writeFileSync(output, content);
  console.log(`extracted ${relative} (${node.size} bytes)`);
}
fs.closeSync(fd);
