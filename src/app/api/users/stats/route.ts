import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthUser } from '@/lib/auth';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const prisma = new PrismaClient();

// 获取用户统计信息
export const GET = withAuth(async (_request: NextRequest, _user: AuthUser) => {
  try {
    // 尝试从缓存获取统计数据
    const cacheKey = `${CACHE_KEYS.USER_STATS}overview`;
    
    const cachedStats = await CacheManager.getOrSet(
      cacheKey,
      async () => {
        // 获取总体统计
        const [totalUsers, activeUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 活跃用户数
      prisma.user.count({
        where: { isActive: true },
      }),
      
      // 今日新用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      
      // 本周新用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // 本月新用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
        ]);

        // 获取角色分布
        const roleDistribution = await prisma.user.groupBy({
          by: ['role'],
          _count: {
            role: true,
          },
          where: {
            isActive: true,
          },
        });

        // 获取最近登录用户
        const recentActiveUsers = await prisma.user.findMany({
          where: {
            isActive: true,
            lastLoginAt: {
              not: null,
            },
          },
          orderBy: {
            lastLoginAt: 'desc',
          },
          take: 10,
          select: {
            id: true,
            username: true,
            gameNickname: true,
            avatarUrl: true,
            role: true,
            lastLoginAt: true,
          },
        });

        // 获取用户注册趋势（最近30天）
        const registrationTrend = await prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM users 
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;

        // 获取在线时长排行榜
        const onlineTimeLeaderboard = await prisma.userProfile.findMany({
          where: {
            user: {
              isActive: true,
            },
          },
          orderBy: {
            onlineTime: 'desc',
          },
          take: 10,
          select: {
            onlineTime: true,
            user: {
              select: {
                id: true,
                username: true,
                gameNickname: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        });

        return {
          overview: {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
          },
          roleDistribution: roleDistribution.map(item => ({
            role: item.role,
            count: item._count.role,
          })),
          recentActiveUsers,
          registrationTrend,
          onlineTimeLeaderboard: onlineTimeLeaderboard.map(item => ({
            user: item.user,
            onlineTime: item.onlineTime,
            onlineTimeFormatted: `${Math.floor(item.onlineTime / 60)}小时${item.onlineTime % 60}分钟`,
          })),
        };
      },
      CACHE_TTL.USER_STATS
    );

    return NextResponse.json({
      success: true,
      data: cachedStats,
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