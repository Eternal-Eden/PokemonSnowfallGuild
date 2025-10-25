/**
 * 最小化服务器 - 用于测试基本功能，不需要数据库连接
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running (minimal mode)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    mode: 'minimal'
  });
});

// API信息端点
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PokemonSnowfallGuild API Server (Minimal Mode)',
    version: '1.0.0',
    mode: 'minimal',
    note: 'Database connection disabled for testing',
    endpoints: {
      health: '/api/health'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 创建HTTP服务器
const server = createServer(app);

// 启动服务器
server.listen(PORT, () => {
  console.log(`✅ Minimal server ready on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API info: http://localhost:${PORT}/api`);
  console.log(`⚠️  Note: Running in minimal mode without database`);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;