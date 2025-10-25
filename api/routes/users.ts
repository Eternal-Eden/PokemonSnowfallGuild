import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// JWT验证中间件
interface CustomAuthRequest {
  user?: {
    id: string;
    userId: string;
    username: string;
    role: string;
    email?: string;
  };
}

type AuthRequest = Request & CustomAuthRequest;

export const authenticateToken = async (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // 验证用户是否存在且活跃
    // 支持两种JWT格式：userId 和 id
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(403).json({ success: false, message: '令牌格式无效' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        email: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: '用户不存在或已禁用' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email || undefined
    };
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ success: false, message: '无效的认证令牌' });
  }
};
  
// 版主权限检查
export const requireModerator = async (req: any, res: any, next: NextFunction) => {
  if (!req.user || req.user.role !== 'MODERATOR') {
    return res.status(403).json({ success: false, message: '需要版主权限' });
  }
  next();
};

// 查询参数验证schema
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  sortBy: z.enum(['username', 'createdAt', 'lastLoginAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 创建用户验证schema
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  gameNickname: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(['MODERATOR', 'USER', 'MEMBER']).optional().default('USER'),
});

// 获取用户列表 (仅版主)
router.get('/', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  try {
    const query = getUsersQuerySchema.parse(req.query);
    
    const { page, limit, search, role, isActive, sortBy, sortOrder } = query;
    
    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { gameNickname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          gameNickname: true,
          email: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              bio: true,
              location: true,
              onlineTime: true,
              joinedAt: true,
            },
          },
          stats: {
            select: {
              followersCount: true,
              followingCount: true,
              postsCount: true,
              repliesCount: true,
              lastActiveAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '请求参数无效',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// 创建用户 (需要版主权限)
router.post('/', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    const { username, gameNickname, email, password, role } = validatedData;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在',
      });
    }

    // 检查邮箱是否已被使用
    if (email) {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册',
        });
      }
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await prisma.user.create({
      data: {
        username,
        gameNickname,
        email,
        passwordHash: hashedPassword,
        role,
        emailVerified: !!email,
        isDefaultPassword: true,
        requirePasswordChange: true,
        createdBy: req.user!.id,
        profile: {
          create: {
            joinedAt: new Date(),
          },
        },
        stats: {
          create: {},
        },
        privacySettings: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        gameNickname: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: '用户创建成功',
      data: { user: newUser },
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '请求参数无效',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// 获取用户统计信息
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// UUID验证函数
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// 获取单个用户基本信息（不需要管理员权限）
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
    }
    
    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        gameNickname: true,
        role: true,
        avatarUrl: true,
        uniqueId: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            location: true,
            website: true,
            onlineTime: true,
            joinedAt: true,
          },
        },
        stats: {
          select: {
            followersCount: true,
            followingCount: true,
            postsCount: true,
            repliesCount: true,
            lastActiveAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 检查隐私设置
    const privacySettings = await prisma.userPrivacySettings.findUnique({
      where: { userId: id },
    });

    // 根据隐私设置过滤信息
    let filteredUser = { ...user };
    
    if (privacySettings) {
      if (!privacySettings.showProfile && filteredUser.profile) {
        filteredUser.profile = {
          ...filteredUser.profile,
          bio: null,
          location: null,
          website: null,
        };
      }
      
      if (!privacySettings.showOnlineTime && filteredUser.profile) {
        filteredUser.profile.onlineTime = 0;
      }
    }

    res.json({
      success: true,
      data: { user: filteredUser },
    });
  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// 获取用户资料
router.get('/:id/profile', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
    }
    
    // 获取用户资料
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: id },
      select: {
        id: true,
        userId: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        onlineTime: true,
        joinedAt: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: '用户资料不存在',
      });
    }

    // 检查隐私设置
    const privacySettings = await prisma.userPrivacySettings.findUnique({
      where: { userId: id },
    });

    if (privacySettings && !privacySettings.showProfile) {
      return res.status(403).json({
        success: false,
        message: '该用户设置了隐私保护',
      });
    }
    
    // 根据隐私设置过滤在线时间
    if (privacySettings && !privacySettings.showOnlineTime) {
      userProfile.onlineTime = 0;
    }

    res.json({
      success: true,
      data: { profile: userProfile },
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// 更新用户资料验证schema
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  birthday: z.string().optional(),
});

// 获取当前用户统计信息
router.get('/me/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // 获取用户统计信息
    let userStats = await prisma.userStats.findUnique({
      where: { userId },
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
    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: {
          userId,
          followersCount: 0,
          followingCount: 0,
          likesReceived: 0,
          postsCount: 0,
          repliesCount: 0,
          lastActiveAt: new Date(),
        },
        select: {
          followersCount: true,
          followingCount: true,
          likesReceived: true,
          postsCount: true,
          repliesCount: true,
          lastActiveAt: true,
        },
      });
    }

    res.json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error('Get user stats error:', error);

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

// 更新用户资料 (需要登录)
router.put('/:id/profile', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProfileSchema.parse(req.body);
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
    }
    
    // 检查权限：只能修改自己的资料或版主可以修改任何人
    if (!req.user || (req.user.id !== id && req.user.role !== 'MODERATOR')) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 更新或创建用户资料
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: id },
      update: {
        ...validatedData,
        birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
      },
      create: {
        userId: id,
        ...validatedData,
        birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
        joinedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        onlineTime: true,
        joinedAt: true,
      },
    });

    res.json({
      success: true,
      message: '用户资料更新成功',
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '请求参数无效',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  } finally {
    await prisma.$disconnect();
  }
}));

export default router;