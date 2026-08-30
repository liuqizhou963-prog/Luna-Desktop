# Luna-Desktop

Luna-Desktop 是一个面向 Windows 的 Luna AI 工作台分发项目。它提供桌面端
AI 工作区、内置 MCP 工具和可扩展的工作流能力，下载发布包后即可直接运行。

本仓库主要负责发布包管理和相关工具；应用二进制文件通过 GitHub Releases
提供，不把大型运行快照、用户会话或个人研究资料提交到 Git 历史中。

## 下载使用

在 GitHub 的 Releases 页面下载 `luna-1.4.7-win-x64.zip`，解压后双击
`露娜.exe` 即可启动。当前发布包面向 Windows x64。

## 目录结构

- `tools/asar/` - ASAR 检查与修补工具。
- `tools/package-luna-release.ps1` - 从本地应用快照生成精简发布目录。
- `docs/project/` - 项目说明和面试资料，仅保存在本地。
- `docs/research/` - 私人研究笔记和提示词，仅保存在本地。
- `artifacts/app/` - 本地应用快照，仅保存在本地。
- `artifacts/inspection/` - 解包和检查副本，仅保存在本地。
- `artifacts/sessions/` - 本地会话历史，仅保存在本地。
- `release/` - 生成的发布包，仅保存在本地。

应用快照、会话数据和研究资料通过 `.gitignore` 排除。请勿把 API 密钥、账号
凭据或其他本地配置提交到版本库。

## 重新打包

重新生成 Windows 发布目录：

```powershell
pwsh -ExecutionPolicy Bypass -File tools/package-luna-release.ps1
```

将 `release/luna-1.4.7-win-x64/` 压缩后作为 GitHub Release 附件上传，
不要把生成的发布包提交到代码仓库。
