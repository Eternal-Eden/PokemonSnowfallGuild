<div align="center">
  <img src="./public/imgs/image_8.jpg" alt="Pokemon Snowfall Guild" width="800" style="border-radius: 10px; margin-bottom: 20px;">
  
  # 🏔️❄️ 落雪公会管理系统
  
  **Pokemon Snowfall Guild Management System**

  [![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
</div>

---

## 🌟 项目简介

kd是小男娘

##  技术架构

### 前端技术栈
- **框架**: Next.js 15.4.1 (App Router)
- **UI库**: React 19.1.0
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 4.0
- **动画**: Framer Motion 12.23.6
- **图表**: Chart.js 4.5.1 + Recharts 3.1.0
- **图标**: Lucide React 0.525.0
- **状态管理**: React Context + Hooks

### 后端技术栈
- **运行时**: Node.js 22.18.0
- **框架**: Express.js 4.21.2
- **语言**: TypeScript 5.9.3
- **数据库**: PostgreSQL 15+
- **ORM**: Prisma 5.22.0
- **认证**: JWT + bcryptjs
- **实时通信**: Socket.IO 4.8.1
- **文件上传**: Multer 1.4.5
- **日志**: Winston 3.17.0
- **验证**: Zod 4.1.7

### 开发工具
- **包管理**: pnpm (推荐) / npm
- **代码检查**: ESLint + TypeScript
- **测试**: Jest 29.7.0
- **部署**: Docker + Vercel
- **监控**: 自定义性能监控

---

##  项目结构

```
LuoXue/
├── 📁 src/                        # 前端源码
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📄 layout.tsx         # 根布局组件
│   │   ├── 📄 page.tsx           # 首页
│   │   ├── 📁 calculator/        # 伤害计算器页面
│   │   ├── 📁 forum/             # 论坛页面
│   │   ├── 📁 templates/         # 模板页面
│   │   ├── 📁 profile/           # 用户资料页面
│   │   └── 📁 api/               # API路由
│   ├── 📁 components/            # React组件
│   │   ├── 📁 calculator/        # 计算器组件
│   │   ├── 📁 forum/             # 论坛组件
│   │   ├── 📁 auth/              # 认证组件
│   │   ├── 📁 ui/                # 基础UI组件
│   │   └── 📁 navigation/        # 导航组件
│   ├── 📁 lib/                   # 工具库
│   │   ├── 📄 pokemonDamageCalculator.ts  # 伤害计算核心
│   │   ├── 📄 forumService.ts    # 论坛服务
│   │   └── 📄 api.ts             # API客户端
│   ├── 📁 types/                 # TypeScript类型定义
│   ├── 📁 contexts/              # React上下文
│   ├── 📁 hooks/                 # 自定义Hooks
│   └── 📁 utils/                 # 工具函数
├── 📁 api/                       # 后端API服务
│   ├── 📄 app.ts                 # Express应用配置
│   ├── 📄 server.ts              # 服务器启动文件
│   ├── 📁 routes/                # API路由
│   ├── 📁 middleware/            # 中间件
│   └── 📁 utils/                 # 后端工具
├── 📁 prisma/                    # 数据库配置
│   ├── 📄 schema.prisma          # 数据库模型
│   └── 📁 migrations/            # 数据库迁移
├── 📁 public/                    # 静态资源
│   ├── 📁 imgs/                  # 图片资源 (100+张)
│   ├── 📁 thumbnails/            # 缩略图
│   ├── 📄 pokedex.yaml           # 宝可梦数据 (649种)
│   ├── 📄 moves.yaml             # 技能数据 (5000+)
│   ├── 📄 items.yaml             # 道具数据 (4000+)
│   ├── 📄 types.yaml             # 属性数据
│   └── 📄 simple_calc.py         # Python伤害计算参考
├── 📁 scripts/                   # 构建和工具脚本
├── 📄 package.json               # 项目依赖
├── 📄 next.config.ts             # Next.js配置
├── 📄 tailwind.config.js         # Tailwind配置
├── 📄 prisma/schema.prisma       # 数据库模型
└── 📄 README.md                  # 项目文档
```

---

##  快速开始

### 环境要求

- Node.js 18.0+ (推荐 22.18.0)
- PostgreSQL 15+
- pnpm (推荐) 或 npm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd LuoXue
   ```

2. **安装依赖**
   ```bash
   # 使用 pnpm (推荐)
   pnpm install
   
   # 或使用 npm
   npm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑环境变量
   # DATABASE_URL="postgresql://username:password@localhost:5432/luoxue"
   # JWT_SECRET="your-jwt-secret"
   # NEXTAUTH_SECRET="your-nextauth-secret"
   ```

4. **数据库设置**
   ```bash
   # 生成 Prisma 客户端
   pnpm db:generate
   
   # 运行数据库迁移
   pnpm db:migrate
   
   # 初始化数据库
   pnpm db:init
   ```

5. **启动开发服务器**
   ```bash
   # 同时启动前端和后端
   pnpm dev
   
   # 或分别启动
   pnpm client:dev  # 前端 (http://localhost:3000)
   pnpm server:dev  # 后端 (http://localhost:8000)
   ```

### 生产部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start

# 或使用 Docker
docker build -t luoxue-guild .
docker run -p 3000:3000 luoxue-guild
```

##  开发指南

### 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm client:dev       # 仅启动前端
pnpm server:dev       # 仅启动后端

# 构建
pnpm build            # 构建生产版本
pnpm build:analyze    # 构建并分析包大小

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 监听模式测试
pnpm test:coverage    # 测试覆盖率

# 数据库
pnpm db:generate      # 生成 Prisma 客户端
pnpm db:push          # 推送数据库变更
pnpm db:migrate       # 运行迁移
pnpm db:studio        # 打开 Prisma Studio
pnpm db:seed          # 填充测试数据

# 代码质量
pnpm lint             # 代码检查
pnpm type-check       # 类型检查

# 工具
pnpm clean            # 清理构建文件
```

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 配置的代码规范
- 组件文件使用 PascalCase 命名
- 工具函数使用 camelCase 命名
- 常量使用 UPPER_SNAKE_CASE 命名

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

<div align="center">
  <p><em>愿每一位训练师都能在这里找到属于自己的冒险！</em></p>
</div>