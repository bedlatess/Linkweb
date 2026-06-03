# LinkWeb — 项目启动与运行指南

> **项目**: LinkWeb v2.0 — 现代化自托管个人链接聚合平台  
> **技术栈**: Next.js 16 · TypeScript · TailwindCSS v4 · Prisma 6 · NextAuth v5  
> **默认端口**: `3010`

---

## 快速开始 (2 步)

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

访问 **http://localhost:3010** 即可看到首页。

---

## 方式一：本地开发环境

### 前置条件

- Node.js 20+ (当前使用 v24.15.0)
- npm 10+

### 步骤

```bash
# 1. 克隆项目并进入目录
cd Linkweb

# 2. 配置环境变量（首次运行需要）
cp .env.example .env
# 编辑 .env，填入你的 GitHub/Google OAuth 凭据（可选，本地测试可跳过）

# 3. 安装依赖
npm install

# 4. 初始化数据库 + 种子数据
npx prisma migrate dev --name init
npx prisma db seed

# 5. 启动开发服务器
npm run dev
# → 访问 http://localhost:3010
```

### 测试账号

| 字段 | 值 |
|------|-----|
| 登录页面 | http://localhost:3010/auth/signin |
| 邮箱 | `admin@linkweb.local` |
| 密码 | `admin123` |
| 用户名 | `admin` |
| 公开页面 | http://localhost:3010/admin |

### 验证点击日志（Prisma Studio）

```bash
# 在项目根目录运行
npx prisma studio

# 浏览器自动打开 http://localhost:5555
# 点击 VisitLog 表查看所有点击记录
```

点击日志收集流程：
1. 访问公开页面 `http://localhost:3010/admin`
2. 点击任意链接 → 客户端自动 `POST /api/visit`
3. 在 Prisma Studio 中 `VisitLog` 表可见新增记录

---

## 方式二：Docker Compose 生产部署

### 前置条件

- Docker Engine 24+
- Docker Compose v2+

### 一键部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，必须填写：
#   NEXTAUTH_SECRET  (生成命令: openssl rand -base64 32)
#   NEXTAUTH_URL     (生产环境填写实际域名)
#   GITHUB_CLIENT_ID / GITHUB_SECRET (可选)
#   GOOGLE_CLIENT_ID / GOOGLE_SECRET (可选)

# 2. 构建并启动（首次构建约 2-3 分钟）
docker compose up -d --build

# 3. 查看日志确认启动成功
docker compose logs -f
# 看到 "Ready in" 即表示启动成功

# 4. 进入容器执行数据库初始化（首次部署需要）
docker compose exec linkweb npx prisma migrate deploy
docker compose exec linkweb npx prisma db seed

# 5. 验证
curl -I http://localhost:3010
# → HTTP/1.1 200 OK
```

### Docker 关键信息

| 项目 | 值 |
|------|-----|
| 容器名 | `linkweb` |
| 端口映射 | `3010:3010` |
| 数据库持久化卷 | `linkweb-data:/app/data` |
| 上传文件持久化卷 | `linkweb-uploads:/app/public/uploads` |
| 基础镜像 | `node:20-alpine` (~130MB 基础) |
| 最终镜像大小 | ~200MB |
| 运行用户 | `nextjs` (非 root, uid 1001) |
| 健康检查 | `GET /api/auth/signin` 每 30 秒 |

### Docker 常用命令

```bash
# 查看日志
docker compose logs -f linkweb

# 重启
docker compose restart

# 进入容器（调试）
docker compose exec linkweb sh

# 停止
docker compose down

# 完全清理（包括数据卷）
docker compose down -v
```

---

## 完整测试流程

### 1. 登录后台

```
http://localhost:3010/auth/signin
→ 输入 admin@linkweb.local / admin123
→ 登录成功后自动跳转到 /dashboard/links
```

### 2. 添加链接

```
在 /dashboard/links 页面：
→ 点击「添加新链接」
→ 填写标题、URL、图标名称（可选）
→ 点击「添加」

右侧手机预览框实时显示链接效果
```

### 3. 拖拽排序

```
鼠标按住链接左侧的 ≡ 手柄
→ 拖动到目标位置
→ 松开后自动保存排序
```

### 4. 自定义主题

```
进入 /dashboard/appearance：
→ 选择一个预设主题（毛玻璃 / 新拟态 / 极简暗黑 / 赛博朋克）
→ 微调背景颜色、模糊度、按钮圆角
→ 点击「保存主题设置」

右侧手机预览实时变色
```

### 5. 查看公开页面

```
http://localhost:3010/admin
→ 显示你的个性化链接聚合页
→ 主题、链接列表、排序全部同步
→ 点击任意链接 → 后台记录点击日志
```

### 6. 验证点击日志

```bash
npx prisma studio
→ VisitLog 表 → 查看最新记录
→ 包含: linkId, ipHash (SHA-256), userAgent, referer, createdAt
```

---

## 环境变量参考

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | SQLite: `file:./dev.db` (本地) / `file:/app/data/linkweb.db` (Docker) |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3010` (本地) / 生产域名 |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` 生成 |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | ❌ | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth 2.0 Client ID |
| `GOOGLE_SECRET` | ❌ | Google OAuth 2.0 Client Secret |

---

## 项目架构速览

```
src/
├── app/
│   ├── page.tsx                      ← 品牌首页
│   ├── [username]/page.tsx           ← 公开访客展示页 (SSR)
│   ├── auth/signin/                  ← Glassmorphism 登录页
│   ├── dashboard/
│   │   ├── layout.tsx                ← 后台布局 (侧边栏 + 内容区)
│   │   ├── links/                    ← 链接管理 (dnd-kit 拖拽 + 手机预览)
│   │   ├── appearance/               ← 主题设置 (4 预设 + 精细调节)
│   │   └── settings/                 ← 账号中心
│   └── api/
│       ├── auth/[...nextauth]/       ← NextAuth 处理器
│       ├── links/                    ← 链接 CRUD + 重排序
│       ├── theme/                    ← 主题 GET/PUT
│       └── visit/                    ← 点击日志 POST (公开)
├── lib/
│   ├── auth.ts                       ← NextAuth v5 配置 (Credentials + GitHub + Google)
│   └── prisma.ts                     ← Prisma 客户端单例
├── stores/
│   └── dashboard-store.ts            ← Zustand 全局状态
└── proxy.ts                          ← 路由守卫 (Next.js 16)
```

---

## 常见问题

**Q: 端口 3010 被占用怎么办？**
A: 修改 `.env` 中的 `NEXTAUTH_URL` 和 `package.json` 中的 `-p` 参数为其他端口。

**Q: 如何重置管理员密码？**
A: 运行 `npx tsx prisma/seed.ts`，会更新 admin 账号密码为 `admin123`。

**Q: Docker 启动后访问页面显示空白？**
A: 检查是否运行了数据库迁移：`docker compose exec linkweb npx prisma migrate deploy`。

**Q: 如何添加更多 OAuth 登录方式？**
A: 编辑 `src/lib/auth.ts`，添加新的 Provider（如 Discord, Apple, Auth0），并在 `.env` 中配置对应的 CLIENT_ID/SECRET。

---

> **Built with ❤️ using Next.js 16, TailwindCSS v4, Prisma 6, and NextAuth v5.  
> Architecture inspired by LinkStackOrg/LinkStack (AGPL v3).**