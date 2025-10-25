import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { withAuth, AuthUser, isModerator } from '@/lib/auth';

const prisma = new PrismaClient();

// 更新帖子验证schema
const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
  isSticky: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  status: z.enum(['pending', 'active', 'rejected', 'closed', 'deleted']).optional(),
  rentalInfo: z.object({
    pokemonName: z.string().optional(),
    level: z.number().int().min(1).max(100).optional(),
    nature: z.string().optional(),
    ability: z.string().optional(),
    moves: z.array(z.string()).max(4).optional(),
    price: z.number().optional(),
    duration: z.string().optional(),
    requirements: z.string().optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个帖子详情
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        authorId: true,
        authorName: true,
        authorAvatar: true,
        authorRole: true,
        categoryId: true,
        status: true,
        isSticky: true,
        isLocked: true,
        viewCount: true,
        likeCount: true,
        replyCount: true,
        lastReplyAt: true,
        lastReplyBy: true,
        tags: true,
        rentalInfo: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            size: true,
            mimeType: true,
            thumbnailUrl: true,
            createdAt: true,
          },
        },
        replies: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            content: true,
            authorId: true,
            authorName: true,
            authorAvatar: true,
            authorRole: true,
            parentReplyId: true,
            likeCount: true,
            rentalResponse: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '帖子不存在' },
        { status: 404 }
      );
    }

    // 增加浏览次数
    await prisma.forumPost.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: { post: { ...post, viewCount: post.viewCount + 1 } },
    });
  } catch (error: unknown) {
    console.error('Get post error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 更新帖子
export const PUT = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);
    
    // 检查帖子是否存在
    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, message: '帖子不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只能修改自己的帖子，或者版主可以修改任何帖子
    if (existingPost.authorId !== user.id && !isModerator(user)) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 普通用户不能修改某些字段
    if (!isModerator(user)) {
      delete validatedData.isSticky;
      delete validatedData.isLocked;
      delete validatedData.status;
    }

    // 验证分类是否存在
    if (validatedData.categoryId) {
      const category = await prisma.forumCategory.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category || !category.isActive) {
        return NextResponse.json(
          { success: false, message: '分类不存在或已禁用' },
          { status: 400 }
        );
      }
    }

    // 准备更新数据
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    // 如果categoryId为null或undefined，则删除该字段
    if (updateData.categoryId === undefined || updateData.categoryId === null) {
      delete updateData.categoryId;
    }

    // 更新帖子
    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        categoryId: true,
        status: true,
        isSticky: true,
        isLocked: true,
        tags: true,
        rentalInfo: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '帖子更新成功',
      data: { post: updatedPost },
    });
  } catch (error: unknown) {
    console.error('Update post error:', error);
    
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

// 删除帖子
export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  { params }: RouteParams
) => {
  try {
    const { id } = await params;
    
    // 检查帖子是否存在
    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, message: '帖子不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只能删除自己的帖子，或者版主可以删除任何帖子
    if (existingPost.authorId !== user.id && !isModerator(user)) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 软删除：更新状态为已删除
    await prisma.forumPost.update({
      where: { id },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });

    // 更新分类的帖子数量
    if (existingPost.categoryId) {
      await prisma.forumCategory.update({
        where: { id: existingPost.categoryId },
        data: {
          postCount: { decrement: 1 },
        },
      });
    }

    // 更新用户统计
    await prisma.userStats.update({
      where: { userId: existingPost.authorId },
      data: {
        postsCount: { decrement: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: '帖子已删除',
    });
  } catch (error: unknown) {
    console.error('Delete post error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});