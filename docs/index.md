# 文档索引

文档分成“对外可提交的索引”和“本地资料”两层。下面的路径以仓库根目录
`Luna/` 为基准；带“本地”标记的内容被 `.gitignore` 排除，不会出现在 GitHub。

## 项目与面试资料

位置：`docs/project/`（本地）

| 文件 | 用途 | 什么时候打开 |
|---|---|---|
| `露娜项目介绍-简洁版.md` | 一页式项目介绍 | 先快速了解项目定位 |
| `露娜项目介绍-面试版.md` | 完整架构、技术亮点、面试问答 | 准备面试或需要讲清系统设计 |
| `露娜项目技术要点速查表.md` | 技术名词和关键实现速查 | 面试前快速复习 |
| `露娜项目简历-800字版.md` | 简历项目描述（长版） | 写简历或项目经历 |
| `露娜项目简历-优化版.md` | 简历项目描述（精简优化版） | 投递简历 |
| `任务清单功能完整复刻规格书.md` | 任务清单功能的提示词、工具、数据层和展示层规格 | 复刻或实现任务清单功能 |

## 研究与运行机制

位置：`docs/research/`（本地）

| 文件 | 用途 | 什么时候打开 |
|---|---|---|
| `Agent.md` | Agent 运行机制研究 | 理解 Agent 层和调用流程 |
| `生命周期.md` | 会话/任务生命周期研究 | 理解状态流转和持久化 |
| `luna_system_prompt_整理版.md` | 人工整理后的系统提示词 | 阅读和讨论提示词结构 |
| `luna_system_prompt_extracted.md` | 从应用快照提取的原始提示词 | 需要核对原始内容时 |

## 应用和发布索引

- 应用进程、入口和快照路径：[`architecture.md`](architecture.md)
- 发布与检查脚本：见根目录 [`README.md`](../README.md) 的“先看哪里”表格
- 本地应用快照：`artifacts/app/luna-1.4.7/`
- ASAR 检查副本：`artifacts/inspection/app-asar-inspect/`
- 发布输出：`release/luna-1.4.7-win-x64/`

## 推荐阅读顺序

```text
README.md
  → docs/index.md
  → docs/architecture.md
  → docs/project/露娜项目介绍-面试版.md（本地）
  → docs/research/Agent.md / 生命周期.md（本地）
```
