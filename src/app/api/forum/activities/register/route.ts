import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthUser } from '@/lib/auth';

// 注册验证schema
const registerActivitySchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().min(1),
  userAvatar: z.string().optional(),
  userRole: z.string()
});

// 活动报名
export const POST = withAuth(async (request: NextRequest, _user: AuthUser) => {
  try {
    const body = await request.json();
    const validatedData = registerActivitySchema.parse(body);
    
    const { activityId, userId, userName, userAvatar, userRole } = validatedData;
    
    // 实现完整的活动验证逻辑
    // 1. 检查活动是否存在
    const activity = await prisma.forumActivity.findUnique({
      where: { id: activityId },
      include: {
        participants: true
      }
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, message: '活动不存在' },
        { status: 404 }
      );
    }

    // 2. 检查活动状态
    if (activity.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: '活动已结束或已取消' },
        { status: 400 }
      );
    }

    // 3. 检查报名截止时间
    if (new Date() > activity.registrationDeadline) {
      return NextResponse.json(
        { success: false, message: '报名时间已截止' },
        { status: 400 }
      );
    }

    // 4. 检查是否已经报名
    const existingParticipant = await prisma.activityParticipant.findFirst({
      where: {
        activityId,
        userId
      }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, message: '您已经报名了此活动' },
        { status: 400 }
      );
    }

    // 5. 检查人数限制
    if (activity.maxParticipants && activity.participants.length >= activity.maxParticipants) {
      return NextResponse.json(
        { success: false, message: '活动报名人数已满' },
        { status: 400 }
      );
    }

    // 6. 检查权限限制
    if (activity.restrictions && Array.isArray(activity.restrictions) && activity.restrictions.length > 0) {
      const userRoles = [userRole];
      const hasPermission = activity.restrictions.some((restriction) => {
        if (typeof restriction === 'object' && restriction !== null && 'type' in restriction && 'value' in restriction) {
          const typedRestriction = restriction as { type: string; value: string };
          if (typedRestriction.type === 'ROLE') {
            return userRoles.includes(typedRestriction.value);
          }
        }
        return true;
      });

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: '您没有权限参加此活动' },
          { status: 403 }
        );
      }
    }

    // 实现完整的活动报名逻辑
    const participant = await prisma.activityParticipant.create({
      data: {
        activityId,
        userId,
        userName,
        userAvatar,
        userRole,
        status: 'REGISTERED'
      }
    });

    // 更新活动参与人数
    await prisma.forumActivity.update({
      where: { id: activityId },
      data: {
        currentParticipants: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '报名成功！',
      data: { participant }
    });
  } catch (error) {
    console.error('Activity registration error:', error);
    
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
});