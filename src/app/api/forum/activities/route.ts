import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 查询参数验证schema
const getActivitiesQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 20),
});

// 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = getActivitiesQuerySchema.parse(Object.fromEntries(searchParams));
    
    const { status, page, limit } = query;
    
    // 实现完整的活动查询逻辑
    // 构建查询条件
    const where: Record<string, unknown> = {};
    
    if (status) {
      if (status.includes(',')) {
        // 支持多状态查询，如 "completed,cancelled,expired"
        where.status = {
          in: status.split(',').map(s => s.trim().toUpperCase())
        };
      } else {
        where.status = status.toUpperCase();
      }
    }

    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询活动列表
    const [activities, total] = await Promise.all([
      prisma.forumActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          participants: {
            select: {
              id: true,
              userId: true,
              userName: true,
              userAvatar: true,
              status: true,
              registeredAt: true
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        }
      }),
      prisma.forumActivity.count({ where })
    ]);

    // 格式化活动数据
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.type,
      status: activity.status,
      startTime: activity.startTime,
      endTime: activity.endTime,
      registrationDeadline: activity.registrationDeadline,
      location: activity.location,
      maxParticipants: activity.maxParticipants,
      currentParticipants: activity._count.participants,
      rewards: activity.rewards,
      restrictions: activity.restrictions,
      organizerId: activity.organizerId,
      organizerName: activity.organizerName,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      participants: activity.participants
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '请求参数无效', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}