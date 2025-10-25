import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthUser } from '@/lib/auth';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const prisma = new PrismaClient();

// 获取当前用户的统计信息
export const GET = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    // 尝试从缓存获取用户统计数据
    const cacheKey = `${CACHE_KEYS.USER_STATS}${user.id}`;
    
    const userStats = await CacheManager.getOrSet(
      cacheKey,
      async () => {
        // 获取用户统计信息
        const stats = await prisma.userStats.findUnique({
          where: { userId: user.id },
          select: {
            followersCount: true,
            followingCount: true,
            likesReceived: true,
            postsCount: true,
            repliesCount: true,
            lastActiveAt: true,
          },
        });

        // 如果没有统计记录，创建默认统计
        if (!stats) {
          const defaultStats = await prisma.userStats.create({
            data: {
              userId: user.id,
              followersCount: 0,
              followingCount: 0,
              likesReceived: 0,
              postsCount: 0,
              repliesCount: 0,
              lastActiveAt: new Date(),
            },
          });
          return defaultStats;
        }

        return stats;
      },
      CACHE_TTL.USER_STATS
    );

    return NextResponse.json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error('Get user stats error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});