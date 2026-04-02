# 启动失败排查（Troubleshooting）

本文用于排查 `pnpm dev` / `pnpm build` 启动失败问题，优先覆盖最常见的端口占用和依赖安装问题。

## 1. 端口被占用

默认端口：

- 前端（Vite）：`5173`
- 后端（Express）：`3000`

### 检查端口占用（PowerShell）

```powershell
Get-NetTCPConnection -LocalPort 3000,5173 -State Listen |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

### 找到进程并结束

```powershell
Get-Process -Id <PID>
Stop-Process -Id <PID> -Force
```

### 或改用新端口

- 后端：修改 `apps/server/.env` 中的 `PORT`
- 前端：在 `apps/web` 启动时指定 `--port` 或调整 `vite.config.ts`

## 2. 依赖安装失败（pnpm install 报错）

### 先确认版本

```powershell
node -v
pnpm -v
```

建议：`Node.js >= 18`，`pnpm >= 9`。

### 清理后重装

```powershell
pnpm store prune
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
pnpm install
```

### 网络或 registry 异常

```powershell
pnpm config get registry
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

如果你使用公司内网代理，需要额外配置 `HTTPS_PROXY` / `HTTP_PROXY`。

## 3. DEEPSEEK_API_KEY 缺失

后端现在会返回 `400 MISSING_API_KEY`，不会直接退出。

请在 `apps/server/.env` 中添加：

```env
DEEPSEEK_API_KEY=sk_live_xxx
```

修改后需要重启后端进程。

## 4. @ai-agent/shared 找不到模块

请在项目根目录执行：

```powershell
pnpm install
pnpm build
```

确保 workspace 依赖已经正确链接并完成构建。

## 5. 仍然失败时建议的最小复现流程

```powershell
pnpm install
pnpm --filter @ai-agent/shared build
pnpm --filter @ai-agent/server dev
pnpm --filter @ai-agent/web dev
```

这样可以快速定位是共享包、后端还是前端阶段失败。
