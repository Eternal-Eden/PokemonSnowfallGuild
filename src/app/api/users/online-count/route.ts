import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const prisma = new PrismaClient();

// 获取在线用户数
export async function GET(_request: NextRequest) {
  try {
    const cacheKey = CACHE_KEYS.ONLINE_USERS;
    
    const onlineData = await CacheManager.getOrSet(
      cacheKey,
      async () => {
        // 计算在线用户数（最近5分钟内有活动的用户）
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const onlineCount = await prisma.user.count({
          where: {
            isActive: true,
            lastLoginAt: {
              gte: fiveMinutesAgo
            }
          }
        });

        return {
          count: onlineCount,
          timestamp: new Date().toISOString()
        };
      },
      CACHE_TTL.ONLINE_USERS
    );

    return NextResponse.json({
      success: true,
      data: onlineData
    });
  } catch (error) {
    console.error('Get online users count error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}