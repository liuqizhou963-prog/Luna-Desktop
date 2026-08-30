# Luna workspace

This workspace contains local inspection utilities and a reverse-engineering
working snapshot of the Luna application.

## Layout

- `tools/asar/` - utilities used during ASAR inspection and patching.
- `tools/package-luna-release.ps1` - builds a clean Windows distribution folder.
- `docs/project/` - Luna project documentation and interview notes; excluded from Git.
- `docs/research/` - private research notes and prompts; excluded from Git.
- `artifacts/app/` - the local packaged application snapshot; excluded from Git.
- `artifacts/inspection/` - extracted inspection copies; excluded from Git.
- `artifacts/sessions/` - local session history; excluded from Git.
- `release/` - generated distribution packages; excluded from Git.

The extracted application and session data are intentionally not part of the
public repository. Keep API keys, credentials, and other local configuration
out of version control as well.

## Distributing the app

Build a Windows release package with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/package-luna-release.ps1
```

Zip `release/luna-1.4.7-win-x64/` and upload the zip as a GitHub Release asset.
Do not commit the generated package to the repository.
