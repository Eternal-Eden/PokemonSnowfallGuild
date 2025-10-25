/**
 * Express应用程序配置
 */

import express, { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 导入中间件
import { requestLogger, logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 导入路由
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import templatesRoutes from './routes/templates';
import pokemonRoutes from './routes/pokemon';
import staticDataRoutes from './routes/staticData';

// ESM模式支持
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 基础中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
}));

// 请求解析中间件
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: Response, buf: Buffer) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')) as any);

// 请求日志中间件
app.use(requestLogger);

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/static-data', staticDataRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API信息端点
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PokemonSnowfallGuild API Server',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// 404处理中间件
app.use(notFoundHandler);

// 全局错误处理中间件
app.use(errorHandler);

// 优雅关闭处理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // 不要退出进程，让PM2或其他进程管理器处理
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // 优雅关闭
  process.exit(1);
});

export default app;