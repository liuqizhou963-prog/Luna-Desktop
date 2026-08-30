const fs = require('fs');
const path = require('path');

const archive = path.resolve(process.argv[2]);
const destination = path.resolve(process.argv[3]);
const unpackedRoot = `${archive}.unpacked`;

const fd = fs.openSync(archive, 'r');
const sizeBuf = Buffer.alloc(8);
fs.readSync(fd, sizeBuf, 0, 8, 0);
const headerSize = sizeBuf.readUInt32LE(4);
const headerBuf = Buffer.alloc(headerSize);
fs.readSync(fd, headerBuf, 0, headerSize, 8);
fs.closeSync(fd);

const headerText = headerBuf.subarray(8).toString('utf8').replace(/\0+$/g, '');
const header = JSON.parse(headerText);
const dataStart = 8 + headerSize;
const archiveFd = fs.openSync(archive, 'r');
let packedCount = 0;
let unpackedCount = 0;
let missingUnpacked = 0;

function walk(node, relative) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const childRelative = path.join(relative, name);
    const outputPath = path.join(destination, childRelative);
    if (child.files) {
      fs.mkdirSync(outputPath, { recursive: true });
      walk(child, childRelative);
      continue;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    if (child.unpacked) {
      unpackedCount++;
      const sourcePath = path.join(unpackedRoot, childRelative);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, outputPath);
      } else {
        missingUnpacked++;
      }
      continue;
    }
    packedCount++;
    const buffer = Buffer.alloc(child.size || 0);
    if (buffer.length) fs.readSync(archiveFd, buffer, 0, buffer.length, dataStart + Number(child.offset));
    fs.writeFileSync(outputPath, buffer);
  }
}

fs.mkdirSync(destination, { recursive: true });
walk(header, '');
fs.closeSync(archiveFd);
console.log(JSON.stringify({ archive, destination, packedCount, unpackedCount, missingUnpacked }, null, 2));
