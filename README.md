# Luna-Desktop

Luna-Desktop 是 Windows 版 Luna AI 工作台的发布与检查仓库。仓库中的 Git
内容负责“如何检查和重新打包”；应用本体、解包副本和研究资料保存在本地，
并由 `.gitignore` 排除。

## 先看哪里

| 你要找的内容 | 真实路径 | 说明 |
|---|---|---|
| 发布/打包入口 | [`tools/package-luna-release.ps1`](tools/package-luna-release.ps1) | 从本地应用快照生成 Windows 发布目录 |
| EXE 品牌修补 | [`tools/patch-luna-exe.mjs`](tools/patch-luna-exe.mjs) | 设置 Luna 独立图标和 Windows 程序身份 |
| ASAR 解包 | [`tools/asar/_extract_asar_for_inspection.cjs`](tools/asar/_extract_asar_for_inspection.cjs) | 把 `app.asar` 展开到检查目录 |
| ASAR 修补 | [`tools/asar/_patch_asar_bootstrap.cjs`](tools/asar/_patch_asar_bootstrap.cjs) | 替换打包应用的 bootstrap |
| 文档总索引 | [`docs/index.md`](docs/index.md) | 逐个说明项目资料和研究笔记 |
| 架构与文件索引 | [`docs/architecture.md`](docs/architecture.md) | 说明应用入口、进程边界和本地快照位置 |
| 项目/面试资料 | `docs/project/`（本地） | 项目介绍、技术要点、规格书，不提交到 Git |
| 研究笔记 | `docs/research/`（本地） | 私人研究与提示词，不提交到 Git |

## 目录结构

```text
Luna/
├── README.md                         # GitHub 首屏导航
├── docs/
│   ├── index.md                       # 文档总索引（逐文件导航）
│   ├── architecture.md               # 可提交的架构和路径索引
│   ├── project/                      # 本地项目/面试资料
│   └── research/                     # 本地研究笔记
├── tools/
│   ├── package-luna-release.ps1      # 发布目录生成器
│   └── asar/                         # ASAR 检查与修补脚本
├── artifacts/                        # 本地快照与检查副本
│   ├── app/luna-1.4.7/               # 原始运行快照
│   │   └── app-source/out/            # 已解包的 Electron 资源
│   ├── inspection/app-asar-inspect/  # app.asar 解包检查副本
│   └── sessions/                     # 本地会话数据
└── release/                          # 本地生成的发布目录/压缩包
```

## 应用文件在哪里

应用不是以可编辑的 `src/` 形式放在本仓库中，而是随本地快照提供的编译产物。
进入 [`docs/architecture.md`](docs/architecture.md) 可按“主进程、预加载、渲染器、
资源、依赖”查找具体路径。不要在 `node_modules/`、`release/` 或重复的
`inspection/` 副本中寻找业务源码。

## 运行发布包

从 GitHub Releases 下载 `luna-1.4.7-win-x64.zip`，解压后双击 `露娜.exe`。

## 重新打包

```powershell
pwsh -ExecutionPolicy Bypass -File tools/package-luna-release.ps1
```

重新生成发布目录后，关闭正在运行的露娜，再执行以下命令修补 EXE 的 Windows
版本资源和图标。脚本会自动保留 `.before-luna-branding.bak` 备份：

```powershell
node tools/patch-luna-exe.mjs
```

脚本默认读取 `artifacts/app/luna-1.4.7/`，输出到
`release/luna-1.4.7-win-x64/`，并自动排除 `app-source/`、`sessions/` 和
`node_modules/` 等检查或运行时数据。

## 提交边界

提交前确认没有把应用快照、会话、压缩包、可执行文件、API 密钥或私人研究资料
加入 Git。完整排除规则见 [`.gitignore`](.gitignore)。
