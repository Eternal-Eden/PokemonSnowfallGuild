import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthUser } from '@/lib/auth';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const prisma = new PrismaClient();

// 消息徽章接口
interface MessageBadge {
  category: string;
  count: number;
  hasUrgent: boolean;
  hasUnread: boolean;
  unreadCount: number;
  urgentCount: number;
  showBadge: boolean;
}

// 获取用户消息徽章信息
export const GET = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    // 尝试从缓存获取徽章数据
    const cacheKey = `${CACHE_KEYS.USER_STATS}badges:${user.id}`;
    
    const badges = await CacheManager.getOrSet(
      cacheKey,
      async () => {
        // 获取用户未读的通知
        const unreadNotifications: Record<string, unknown>[] = [];

        // 按类别统计徽章信息
        const badgeMap: Record<string, MessageBadge> = {
          system: {
            category: 'system',
            count: 0,
            hasUrgent: false,
            hasUnread: false,
            unreadCount: 0,
            urgentCount: 0,
            showBadge: false,
          },

          notification: {
            category: 'notification',
            count: 0,
            hasUrgent: false,
            hasUnread: false,
            unreadCount: 0,
            urgentCount: 0,
            showBadge: false,
          },
          reminder: {
            category: 'reminder',
            count: 0,
            hasUrgent: false,
            hasUnread: false,
            unreadCount: 0,
            urgentCount: 0,
            showBadge: false,
          },
          announcement: {
            category: 'announcement',
            count: 0,
            hasUrgent: false,
            hasUnread: false,
            unreadCount: 0,
            urgentCount: 0,
            showBadge: false,
          },
        };

        // 统计各类别的消息
        unreadNotifications.forEach((notification) => {
          const category = (notification.type && typeof notification.type === 'string') 
            ? notification.type.toLowerCase() 
            : 'notification';
          const badge = badgeMap[category] || badgeMap.notification;
          
          badge.count++;
          badge.hasUnread = true;
          badge.unreadCount++;
          badge.showBadge = true;
          
          if (notification.priority === 'urgent' || notification.priority === 'high') {
            badge.hasUrgent = true;
            badge.urgentCount++;
          }
        });

        // 返回有消息的徽章
        return Object.values(badgeMap).filter(badge => badge.showBadge);
      },
      CACHE_TTL.USER_STATS
    );

    return NextResponse.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error('Get message badges error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});