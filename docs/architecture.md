# Luna 应用架构与文件索引

这份文档描述当前本地快照的真实布局。它不是假设中的 `src/agent/` 模板：
当前仓库拿到的是 Electron 编译/打包结果，业务代码主要位于 `index.jsc` 和
`app.asar` 中，不能像普通 TypeScript 项目一样逐文件编辑。

## 一眼看懂

```text
露娜.exe
└── resources/
    ├── app.asar                     # 打包后的应用资源
    ├── app.asar.unpacked/           # 必须以独立文件存在的原生资源
    └── *.ico / *.png                # 应用图标

artifacts/app/luna-1.4.7/app-source/ # 为检查保留的解包副本
└── out/
    ├── main/                        # Electron 主进程
    ├── preload/                     # 渲染器与主进程之间的桥接层
    ├── renderer/                    # 页面入口
    └── resources/                   # Tai-An 场景资源
```

## 按职责找文件

| 职责 | 文件/目录 | 你能在那里看到什么 |
|---|---|---|
| 主进程启动 | `artifacts/app/luna-1.4.7/app-source/out/main/bootstrap.js` | 窗口、图标、单实例、硬件加速和启动分支 |
| 主进程业务 | `artifacts/app/luna-1.4.7/app-source/out/main/index.jsc` | 编译后的主进程实现（Bytenode 字节码） |
| 主进程开发分支 | `artifacts/app/luna-1.4.7/app-source/out/main/index.js` | 非打包模式入口（当前为极小的加载器） |
| Preload 桥接 | `artifacts/app/luna-1.4.7/app-source/out/preload/` | `index.js`、Tai-An 相关 preload 脚本 |
| Renderer 页面 | `artifacts/app/luna-1.4.7/app-source/out/renderer/index.html` | Electron 渲染器 HTML 入口 |
| Tai-An 资源 | `artifacts/app/luna-1.4.7/app-source/out/resources/tai-an/` | `flow-data-schema.ts`、`flow-template.html` |
| 生产运行入口 | `release/luna-1.4.7-win-x64/resources/app.asar` | 发布包实际加载的 ASAR |
| 解包检查副本 | `artifacts/inspection/app-asar-inspect/` | 与 `app-source` 同样的 `out/` 布局，用于只读检查 |
| 依赖 | `artifacts/app/luna-1.4.7/app-source/node_modules/` | Electron 应用运行依赖，不是业务源码 |

## 启动链路

```text
露娜.exe
  → resources/app.asar
  → out/main/bootstrap.js
  → app.isPackaged ? out/main/index.jsc : out/main/index.js
  → preload/index.js
  → renderer/index.html
```

## 这几个目录不要混用

- `artifacts/app/luna-1.4.7/`：原始本地运行快照，保留 `app-source/` 供检查。
- `artifacts/inspection/app-asar-inspect/`：从 ASAR 展开的检查副本，修改它不会
  自动改变发布包。
- `release/luna-1.4.7-win-x64/`：发布输出，只用于运行或压缩上传。
- `docs/project/`、`docs/research/`：资料和笔记，不是应用代码。

## 修改和验证应该走哪里

1. 修改打包逻辑：编辑 `tools/` 下脚本。
2. 修改应用实现：需要拿到对应的上游源码或重新构建产物；不要直接把
   `index.jsc` 当作普通 JS 编辑。
3. 重新生成发布目录：运行 `tools/package-luna-release.ps1`。
4. 检查发布内容：对 `release/luna-1.4.7-win-x64/` 做只读检查，不要把发布目录
   当作源码目录。
