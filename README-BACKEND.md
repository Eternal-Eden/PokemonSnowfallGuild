# PokemonSnowfallGuild 后端开发指南

## 项目概述

PokemonSnowfallGuild是一个基于宝可梦主题的公会管理系统，提供完整的社区功能，包括用户管理、论坛交流、频道聊天、圈子社区、好友系统、消息通知和数据统计等核心功能。

## 技术栈

### 后端技术
- **运行时**: Node.js 18+
- **框架**: Express.js 4.x
- **数据库**: PostgreSQL 15
- **ORM**: Prisma 5.x
- **认证**: JWT + bcrypt
- **实时通信**: Socket.IO 4.x
- **文件上传**: Multer
- **邮件服务**: Nodemailer
- **日志**: Winston
- **验证**: Joi
- **语言**: TypeScript 5.x

### 开发工具
- **代码规范**: ESLint + Prettier
- **进程管理**: PM2
- **容器化**: Docker
- **包管理**: pnpm

## 项目结构

```
PokemonSnowfallGuild/
├── api/                          # 后端API代码
│   ├── app.ts                   # Express应用配置
│   ├── server.ts                # 服务器启动文件
│   ├── index.ts                 # API入口文件
│   ├── middleware/              # 中间件
│   │   ├── auth.ts             # JWT认证中间件
│   │   └── errorHandler.ts     # 错误处理中间件
│   ├── routes/                  # 路由定义
│   │   └── auth.ts             # 认证路由
│   ├── controllers/             # 控制器（待实现）
│   ├── services/                # 业务逻辑服务（待实现）
│   ├── utils/                   # 工具函数
│   │   ├── logger.ts           # 日志工具
│   │   ├── jwt.ts              # JWT工具
│   │   ├── password.ts         # 密码加密工具
│   │   ├── email.ts            # 邮件发送工具
│   │   ├── validation.ts       # 请求验证工具
│   │   └── database.ts         # 数据库连接工具
│   └── types/                   # 类型定义（待实现）
├── prisma/                      # Prisma配置
│   └── schema.prisma           # 数据库模型定义
├── scripts/                     # 脚本文件
│   └── init-db.ts              # 数据库初始化脚本
├── uploads/                     # 文件上传目录
├── logs/                        # 日志文件目录
├── src/                         # 前端代码
├── .env                         # 环境变量配置
├── package.json                 # 项目依赖配置
├── nodemon.json                 # Nodemon配置
└── tsconfig.json               # TypeScript配置
```

## 快速开始

### 1. 环境准备

确保你的系统已安装：
- Node.js 18+
- PostgreSQL 15
- pnpm（推荐）或 npm

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

复制并配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键变量：

```env
# 数据库配置
DATABASE_URL="postgresql://postgres:371102@localhost:5432/pokemon_guild_dev?schema=public"

# 服务器配置
PORT=3001
NODE_ENV=development

# JWT配置
JWT_SECRET="pokemon_guild_jwt_secret_key_2024"
JWT_EXPIRES_IN="7d"

# 邮件配置（用于验证码）
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="PokemonSnowfallGuild <noreply@pokemonguild.com>"
```

### 4. 数据库设置

#### 创建数据库

```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE pokemon_guild_dev;

-- 退出
\q
```

#### 初始化数据库结构和数据

```bash
# 推送数据库结构
npm run db:push

# 初始化数据（创建管理员用户和测试数据）
npm run db:seed
```

### 5. 启动开发服务器

```bash
# 启动前后端开发服务器
npm run dev

# 或者只启动后端服务器
npm run server:dev
```

服务器将在以下端口启动：
- 后端API: http://localhost:3001
- 前端应用: http://localhost:3000

## 数据库管理

### 常用命令

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库结构（开发环境）
npm run db:push

# 创建迁移文件
npm run db:migrate

# 部署迁移（生产环境）
npm run db:migrate:deploy

# 重置数据库
npm run db:reset

# 运行数据库种子
npm run db:seed

# 打开Prisma Studio
npm run db:studio

# 完整初始化（推送结构+种子数据）
npm run db:init
```

### 默认用户账户

数据库初始化后，将创建以下默认账户：

#### 管理员账户
- **用户名**: `admin`
- **邮箱**: `admin@pokemonguild.com`
- **密码**: `Admin123!@#`
- **角色**: 超级管理员
- **注意**: 首次登录后请立即修改密码

#### 测试账户（仅开发环境）
- **用户名**: `testuser1` / `testuser2` / `moderator1`
- **密码**: `Test123!@#`
- **角色**: 普通用户 / 版主

## API接口

### 认证相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login-or-register` | 登录即注册 |
| POST | `/api/auth/send-verification-code` | 发送邮箱验证码 |
| POST | `/api/auth/verify-code` | 验证邮箱验证码 |
| POST | `/api/auth/change-password` | 修改密码 |
| POST | `/api/auth/request-password-reset` | 请求密码重置 |
| POST | `/api/auth/reset-password` | 重置密码 |
| POST | `/api/auth/refresh-token` | 刷新令牌 |
| POST | `/api/auth/logout` | 用户登出 |
| GET  | `/api/auth/me` | 获取当前用户信息 |

### 系统接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api` | API信息 |

## 开发指南

### 登录即注册功能

系统采用登录即注册的设计：

1. **已注册用户**：直接使用用户名和密码登录
2. **新用户**：提供用户名、密码、邮箱、游戏昵称和邮箱验证码进行注册

#### 新用户注册流程

1. 用户输入用户名和密码尝试登录
2. 系统检测到用户不存在，提示需要注册
3. 用户补充邮箱和游戏昵称信息
4. 系统发送邮箱验证码
5. 用户输入验证码完成注册
6. 自动登录并返回JWT令牌

### 中间件使用

#### 认证中间件

```typescript
import { authenticateToken, requireAdmin, requireModerator } from '../middleware/auth.js';

// 需要登录
router.get('/protected', authenticateToken, handler);

// 需要管理员权限
router.post('/admin-only', authenticateToken, requireAdmin, handler);

// 需要版主权限
router.put('/moderator-only', authenticateToken, requireModerator, handler);
```

#### 验证中间件

```typescript
import { validate, authSchemas } from '../utils/validation.js';

// 验证请求体
router.post('/login', validate(authSchemas.loginOrRegister), handler);
```

#### 错误处理

```typescript
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

// 异步路由处理
router.get('/async-route', asyncHandler(async (req, res) => {
  // 异步操作
  const data = await someAsyncOperation();
  res.json({ success: true, data });
}));

// 抛出自定义错误
throw new AppError('Custom error message', 400);
```

### 数据库操作

```typescript
import { getPrismaClient } from '../utils/database.js';

const prisma = getPrismaClient();

// 创建用户
const user = await prisma.user.create({
  data: {
    username: 'newuser',
    email: 'user@example.com',
    passwordHash: hashedPassword
  },
  include: {
    profile: true,
    stats: true
  }
});

// 查询用户
const users = await prisma.user.findMany({
  where: {
    isActive: true
  },
  include: {
    profile: true
  }
});
```

### 日志记录

```typescript
import { logger } from '../utils/logger.js';

// 不同级别的日志
logger.error('Error message', { error: errorObject });
logger.warn('Warning message');
logger.info('Info message', { userId: '123' });
logger.debug('Debug message');
```

## 部署指南

### 生产环境配置

1. **环境变量**
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://user:password@host:5432/pokemon_guild"
   JWT_SECRET="your-secure-jwt-secret"
   ```

2. **数据库迁移**
   ```bash
   npm run db:migrate:deploy
   ```

3. **构建和启动**
   ```bash
   npm run build
   npm start
   ```

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证DATABASE_URL配置
   - 确认数据库用户权限

2. **Prisma生成失败**
   ```bash
   npm run db:generate
   ```

3. **邮件发送失败**
   - 检查邮件服务器配置
   - 验证SMTP认证信息
   - 确认防火墙设置

4. **JWT验证失败**
   - 检查JWT_SECRET配置
   - 验证令牌格式
   - 确认令牌未过期

### 日志查看

```bash
# 查看应用日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: dev@pokemonguild.com

---

**注意**: 这是开发版本的文档。生产环境部署前请确保所有安全配置已正确设置。