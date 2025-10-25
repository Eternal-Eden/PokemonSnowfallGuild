import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { withAuth, AuthUser } from '@/lib/auth';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const prisma = new PrismaClient();

// 查询参数验证schema
const getPostsQuerySchema = z.object({
  page: z.string().optional().transform((val: string | undefined) => {
    if (!val) return 1;
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform((val: string | undefined) => {
    if (!val) return 20;
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100); // 限制最大值为100
  }),
  categoryId: z.string().optional().refine((val) => {
    if (!val) return true;
    // 简单的UUID格式检查，更宽松
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }, { message: "Invalid categoryId format" }),
  type: z.enum(['discussion', 'pokemon_rental', 'event']).optional().catch(undefined),
  status: z.enum(['pending', 'active', 'rejected', 'closed', 'deleted']).optional().catch(undefined),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'viewCount', 'likeCount', 'replyCount']).optional().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().catch('desc'),
  authorId: z.string().optional().refine((val) => {
    if (!val) return true;
    // 简单的UUID格式检查，更宽松
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }, { message: "Invalid authorId format" }),
});

// 创建帖子验证schema
const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: z.enum(['discussion', 'pokemon_rental', 'event']),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
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

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams);
    
    // 记录原始参数用于调试
    console.log('Raw query params:', rawParams);
    
    // 使用safeParse进行更安全的参数验证
    const parseResult = getPostsQuerySchema.safeParse(rawParams);
    
    if (!parseResult.success) {
      console.error('Parameter validation failed:', parseResult.error.issues);
      // 返回更详细的错误信息
      return NextResponse.json(
        { 
          success: false, 
          message: '请求参数格式错误', 
          details: parseResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            received: 'received' in issue ? issue.received : undefined
          }))
        },
        { status: 400 }
      );
    }
    
    const query = parseResult.data;
    
    const { page, limit, categoryId, type, status, search, sortBy, sortOrder, authorId } = query;
    
    // 生成缓存键（基于查询参数）
    const cacheKey = `${CACHE_KEYS.FORUM_POSTS}${JSON.stringify(query)}`;
    
    const postsData = await CacheManager.getOrSet(
      cacheKey,
      async () => {
        // 构建查询条件
    const where: {
      status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'DELETED';
      categoryId?: string;
      type?: 'DISCUSSION' | 'POKEMON_RENTAL' | 'EVENT';
      authorId?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
        authorName?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      status: (status || 'ACTIVE') as 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'DELETED',
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (type) {
      where.type = type as 'DISCUSSION' | 'POKEMON_RENTAL' | 'EVENT';
    }
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
        // 查询帖子
        const [posts, total] = await Promise.all([
          prisma.forumPost.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy as string]: sortOrder },
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
                  thumbnailUrl: true,
                },
              },
            },
          }),
          prisma.forumPost.count({ where }),
        ]);
        
        return {
          posts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      CACHE_TTL.FORUM_POSTS
    );
    
    return NextResponse.json({
      success: true,
      data: postsData,
    });
  } catch (error: unknown) {
    console.error('Get posts error:', error);
    
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

// 创建帖子 (需要登录)
export const POST = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);
    
    const { title, content, type, categoryId, tags, rentalInfo } = validatedData;

    // 获取用户信息
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证分类是否存在
    if (categoryId) {
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || !category.isActive) {
        return NextResponse.json(
          { success: false, message: '分类不存在或已禁用' },
          { status: 400 }
        );
      }
    }

    // 创建帖子
    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        type: type.toUpperCase() as 'DISCUSSION' | 'POKEMON_RENTAL' | 'EVENT',
        authorId: user.id,
        authorName: userInfo.username,
        authorAvatar: userInfo.avatarUrl,
        authorRole: userInfo.role,
        categoryId,
        tags: tags || [],
        rentalInfo: rentalInfo || undefined,
        status: 'ACTIVE', // 默认为活跃状态，可以根据需要添加审核机制
      },
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
        tags: true,
        rentalInfo: true,
        createdAt: true,
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

    // 更新分类的帖子数量和最后发帖信息
    if (categoryId) {
      await prisma.forumCategory.update({
        where: { id: categoryId },
        data: {
          postCount: { increment: 1 },
          lastPostAt: new Date(),
          lastPostTitle: title,
        },
      });
    }

    // 更新用户统计
    await prisma.userStats.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        postsCount: 1,
      },
      update: {
        postsCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: '帖子创建成功',
      data: { post: newPost },
    });
  } catch (error: unknown) {
    console.error('Create post error:', error);
    
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