import fs from "node:fs/promises";
import path from "node:path";
import { rcedit } from "../artifacts/inspection/icon-tool/node_modules/rcedit/lib/index.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      path.join(repoRoot, "artifacts", "app", "luna-1.4.7", "露娜.exe"),
      path.join(repoRoot, "release", "luna-1.4.7-win-x64", "露娜.exe"),
    ];

const iconPath = path.join(
  repoRoot,
  "release",
  "luna-1.4.7-win-x64",
  "resources",
  "luna-blue.ico",
);

const versionString = {
  CompanyName: "Luna",
  FileDescription: "露娜 AI 工作台",
  InternalName: "Luna",
  LegalCopyright: "Copyright (c) Luna",
  OriginalFilename: "露娜.exe",
  ProductName: "露娜",
  ProductVersion: "1.4.7",
};

await fs.access(iconPath);

for (const target of targets) {
  const absoluteTarget = path.resolve(target);
  await fs.access(absoluteTarget);
  const backup = `${absoluteTarget}.before-luna-branding.bak`;
  try {
    await fs.access(backup);
  } catch {
    await fs.copyFile(absoluteTarget, backup);
  }
  await rcedit(absoluteTarget, {
    icon: iconPath,
    "file-version": "1.4.7.0",
    "product-version": "1.4.7.0",
    "version-string": versionString,
  });
  console.log(`Patched ${absoluteTarget}`);
}
