import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { withAuth, AuthUser, verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// 更新用户验证schema
const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  gameNickname: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['MODERATOR', 'USER', 'MEMBER']).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
  profile: z.object({
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    website: z.string().url().optional(),
    birthday: z.string().optional(),
  }).optional(),
  privacySettings: z.object({
    showProfile: z.boolean().optional(),
    showStats: z.boolean().optional(),
    showOnlineTime: z.boolean().optional(),
    showPokemonShowcase: z.boolean().optional(),
    showTeamShowcase: z.boolean().optional(),
    showActivity: z.boolean().optional(),
    allowFollow: z.boolean().optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Define types for user data
interface UserWithProfile {
  id: string;
  username: string;
  gameNickname?: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  stats?: Record<string, unknown>;
  profile?: {
    onlineTime?: number;
    [key: string]: unknown;
  };
  privacySettings?: {
    showProfile: boolean;
    showStats: boolean;
    showOnlineTime: boolean;
    [key: string]: unknown;
  };
}

interface UpdateData {
  username?: string;
  gameNickname?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  avatarUrl?: string;
  profile?: {
    upsert: {
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    };
  };
  privacySettings?: {
    upsert: {
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    };
  };
}

// 获取单个用户信息
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // 验证用户身份
    const currentUser = await verifyToken(request);
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        gameNickname: true,
        email: currentUser && currentUser.id === id ? true : undefined,
        role: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: currentUser && currentUser.id === id ? true : undefined,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            location: true,
            website: true,
            birthday: true,
            onlineTime: true,
            joinedAt: true,
          },
        },
        stats: {
          select: {
            followersCount: true,
            followingCount: true,
            likesReceived: true,
            postsCount: true,
            repliesCount: true,
            lastActiveAt: true,
          },
        },
        privacySettings: currentUser && currentUser.id === id ? {
          select: {
            showProfile: true,
            showStats: true,
            showOnlineTime: true,
            showPokemonShowcase: true,
            showTeamShowcase: true,
            showActivity: true,
            allowFollow: true,
          },
        } : false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 根据隐私设置过滤数据
    if (currentUser?.id !== id) {
      const privacySettings = await prisma.userPrivacySettings.findUnique({
        where: { userId: id },
      });

      if (privacySettings) {
        if (!privacySettings.showProfile) {
          return NextResponse.json(
            { success: false, message: '该用户设置了隐私保护' },
            { status: 403 }
          );
        }
        
        if (!privacySettings.showStats && user.stats) {
          (user as any).stats = null;
        }
        
        if (!privacySettings.showOnlineTime && user.profile) {
          (user.profile as any).onlineTime = 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 更新用户信息
export const PUT = withAuth(async (
  request: NextRequest,
  currentUser: AuthUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);
    
    // 检查权限：只能修改自己的信息
    if (currentUser.id !== id) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查用户名是否已被其他用户使用
    if (validatedData.username) {
      const userWithSameUsername = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: id },
        },
      });

      if (userWithSameUsername) {
        return NextResponse.json(
          { success: false, message: '用户名已被使用' },
          { status: 400 }
        );
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (validatedData.email) {
      const userWithSameEmail = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
        },
      });

      if (userWithSameEmail) {
        return NextResponse.json(
          { success: false, message: '邮箱已被使用' },
          { status: 400 }
        );
      }
    }

    // 普通用户不能修改角色和激活状态
    if (validatedData.role || validatedData.isActive !== undefined) {
      return NextResponse.json(
        { success: false, message: '权限不足，无法修改角色或状态' },
        { status: 403 }
      );
    }

    // 准备更新数据
    const updateData: UpdateData = {};
    const { profile, privacySettings, ...userFields } = validatedData;
    
    // 更新用户基本信息
    Object.assign(updateData, userFields);
    
    // 更新用户资料
    if (profile) {
      updateData.profile = {
        upsert: {
          create: profile,
          update: profile,
        },
      };
    }
    
    // 更新隐私设置
    if (privacySettings) {
      updateData.privacySettings = {
        upsert: {
          create: privacySettings,
          update: privacySettings,
        },
      };
    }

    // 执行更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData as any,
      select: {
        id: true,
        username: true,
        gameNickname: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            location: true,
            website: true,
            birthday: true,
            onlineTime: true,
            joinedAt: true,
          },
        },
        privacySettings: {
          select: {
            showProfile: true,
            showStats: true,
            showOnlineTime: true,
            showPokemonShowcase: true,
            showTeamShowcase: true,
            showActivity: true,
            allowFollow: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: { user: updatedUser },
    });
  } catch (error: unknown) {
    console.error('Update user error:', error);
    
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