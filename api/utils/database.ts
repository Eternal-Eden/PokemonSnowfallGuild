/**
 * 数据库连接工具模块
 */
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// 全局Prisma客户端实例
let prisma: PrismaClient;

// 创建Prisma客户端实例
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'pretty',
  });
};

// 获取Prisma客户端实例（单例模式）
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = createPrismaClient();

    // 设置日志事件监听器（暂时注释掉以避免类型错误）
    // prisma.$on('query', (e) => {
    //   if (process.env.NODE_ENV === 'development') {
    //     logger.debug('Database Query:', {
    //       query: e.query,
    //       params: e.params,
    //       duration: `${e.duration}ms`,
    //       target: e.target
    //     });
    //   }
    // });

    // prisma.$on('error', (e) => {
    //   logger.error('Database Error:', {
    //     message: e.message,
    //     target: e.target
    //   });
    // });

    // prisma.$on('info', (e) => {
    //   logger.info('Database Info:', {
    //     message: e.message,
    //     target: e.target
    //   });
    // });

    // prisma.$on('warn', (e) => {
    //   logger.warn('Database Warning:', {
    //     message: e.message,
    //     target: e.target
    //   });
    // });
  }

  return prisma;
};

// 连接数据库
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// 断开数据库连接
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Failed to disconnect from database:', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// 检查数据库连接状态
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', { error: error instanceof Error ? error.message : error });
    return false;
  }
};

// 执行数据库迁移
export const runMigrations = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    // 注意：在生产环境中，应该使用 prisma migrate deploy
    // 这里只是检查数据库连接
    await client.$queryRaw`SELECT 1`;
    logger.info('Database migrations check completed');
  } catch (error) {
    logger.error('Database migrations failed:', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// 清理过期数据
export const cleanupExpiredData = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    const now = new Date();

    // 邮箱验证码功能已移除

    // 清理过期的密码重置令牌
    const expiredTokens = await client.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    // 清理过期的用户会话
    const expiredSessions = await client.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    logger.info('Expired data cleanup completed', {
      expiredTokens: expiredTokens.count,
      expiredSessions: expiredSessions.count
    });
  } catch (error) {
    logger.error('Failed to cleanup expired data:', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// 获取数据库统计信息
export const getDatabaseStats = async (): Promise<any> => {
  try {
    const client = getPrismaClient();

    const stats = {
      users: await client.user.count(),
      activeUsers: await client.user.count({
        where: { isActive: true }
      }),
      // 邮箱验证码功能已移除
      activeSessions: await client.userSession.count({
        where: {
          expiresAt: {
            gt: new Date()
          }
        }
      })
    };

    return stats;
  } catch (error) {
    logger.error('Failed to get database stats:', { error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// 优雅关闭处理
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

// 导出默认的Prisma客户端实例
export default getPrismaClient;