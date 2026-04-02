# ⚡ 快速启动指南

## 5 分钟快速上手

### 第一步：准备工作

1. **获取 DeepSeek API Key**
   - 访问：https://platform.deepseek.com/api_keys
   - 注册并创建 API Key
   - 复制 API Key（格式：`sk_live_...`）

2. **检查环境**

   ```bash
   node --version  # 需要 v18+
   npm --version
   ```

3. **安装 pnpm**
   ```bash
   npm install -g pnpm@9.0.0
   ```

### 第二步：初始化项目

```bash
# 1. 进入项目目录
cd ai-agent-monorepo

# 2. 安装所有依赖
pnpm install

# 3. 配置后端 API Key
cd apps/server
cp .env.example .env
# 编辑 .env 文件，填入 DEEPSEEK_API_KEY=sk_live_your_key_here
```

### 第三步：启动项目

```bash
# 从项目根目录运行
cd ../..  # 返回到项目根目录
pnpm dev
```

你会看到类似输出：

```
> web@dev
> vite
  VITE v5.0.0  ready in 234 ms
  ➜  Local:   http://localhost:5173/

> server@dev
> ts-node-dev --esm src/index.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AI Agent 后端服务器已启动
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 服务器运行于: http://localhost:3000
🔧 环境: development
🤖 AI 模型: deepseek-chat
📡 API 基础 URL: https://api.deepseek.com/v1
```

### 第四步：打开应用

1. 浏览器自动打开 http://localhost:5173
2. 在输入框输入消息
3. 点击发送按钮或按 Enter
4. 享受 AI 的流式回复！

---

## 🔧 常用命令

```bash
# 启动开发模式（同时启动前后端）
pnpm dev

# 仅启动后端服务器
pnpm --filter @ai-agent/server dev

# 仅启动前端
pnpm --filter @ai-agent/web dev

# 构建所有项目
pnpm build

# 清理所有输出
pnpm clean

# 查看项目结构
tree -I node_modules
```

---

## ⚙️ 环境变量配置

### 必配置

**后端 `apps/server/.env`：**

```env
DEEPSEEK_API_KEY=sk_live_your_api_key_here
```

### 可选配置

**后端其他选项（`apps/server/.env`）：**

```env
PORT=3000                           # 后端端口
NODE_ENV=development                # 环境
FRONTEND_URL=http://localhost:5173  # 前端地址（CORS）
```

**前端（`apps/web/.env`）：**

```env
REACT_APP_API_URL=http://localhost:3000  # 后端地址
```

---

## 🧪 测试

### 方法 1：使用前端 UI

1. 打开 http://localhost:5173
2. 输入任何问题，如："你好"
3. 观察 AI 的流式回复

### 方法 2：使用 curl 测试 API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "test_1",
        "role": "user",
        "content": "Hello, say hi"
      }
    ]
  }'
```

### 方法 3：健康检查

```bash
curl http://localhost:3000/health
```

---

## 🚨 常见问题速查

| 问题                                    | 解决方案                                              |
| --------------------------------------- | ----------------------------------------------------- |
| `pnpm: command not found`               | 运行 `npm install -g pnpm@9.0.0`                      |
| `DEEPSEEK_API_KEY 未设置`               | 检查 `apps/server/.env` 文件是否正确配置              |
| `Cannot find module '@ai-agent/shared'` | 运行 `pnpm install` 重新安装依赖                      |
| 前端显示空白                            | 打开 F12 开发者工具查看控制台错误                     |
| 后端无法连接                            | 确保后端已启动（http://localhost:3000/health 可访问） |

---

## 📂 项目结构概览

```
ai-agent-monorepo/
├── apps/web          # 前端应用（React + Vite）
├── apps/server       # 后端应用（Express）
├── packages/shared   # 共享模块
├── package.json      # 根配置（workspace）
└── turbo.json        # TurboRepo 配置
```

---

## 📖 更多信息

详见 [README.md](./README.md) 获取完整文档。

---

**准备好了吗？让我们开始构建 AI 应用吧！** 🚀

## 启动失败排查入口

如果启动过程中遇到错误，请查看：

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
