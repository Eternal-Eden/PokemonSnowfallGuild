import { PrismaClient } from '@prisma/client';

// 全局变量声明
declare global {
  var __prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// 使用全局变量避免在开发环境中重复创建实例
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;