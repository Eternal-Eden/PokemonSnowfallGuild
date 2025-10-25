/**
 * local server entry file, for local development
 */
import { createServer } from 'http';
import app from './app';
// import { initializeSocket } from '../src/lib/socket';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

// 创建HTTP服务器
const server = createServer(app);

// 启动服务器
server.listen(PORT, async () => {
  console.log(`Server ready on port ${PORT}`);
  
  // 初始化Socket.IO
  // try {
  //   const io = await initializeSocket(server);
  //   if (io) {
  //     console.log(`Socket.IO server initialized`);
  //   }
  // } catch (error) {
  //   console.warn('Failed to initialize Socket.IO:', error);
  // }
});

/**
 * close server
 */
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