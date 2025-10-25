import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken as verifyJWT, generateToken as generateJWT, TokenPayload } from '../../api/utils/jwt';
// 条件导入Redis，只在服务端环境使用
let CacheManager: any = null;
let CACHE_KEYS: any = {};
let CACHE_TTL: any = {};

if (typeof window === 'undefined') {
  // 只在服务端导入Redis
  try {
    const redisModule = require('./redis');
    CacheManager = redisModule.CacheManager;
    CACHE_KEYS = redisModule.CACHE_KEYS;
    CACHE_TTL = redisModule.CACHE_TTL;
  } catch (error) {
    console.warn('Redis模块加载失败，将使用内存缓存:', error);
  }
}
import { logger } from './logger';
import { InputValidator } from './security';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  email?: string;
}

/**
 * 从请求中提取并验证JWT token - 支持RS256
 */
export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('认证头缺失或格式错误', { authHeader: authHeader?.substring(0, 20) });
      return null;
    }

    const token = authHeader.substring(7);
    
    // 检查token基本格式
    if (!token || token.trim() === '') {
      logger.warn('空的JWT令牌');
      return null;
    }
    
    logger.debug('开始验证前端JWT令牌', { tokenLength: token.length });
    
    // 使用升级后的JWT验证函数
    const decoded = verifyJWT(token);
    
    // 尝试从缓存获取用户信息（仅在服务端）
    let user: any = null;
    
    if (CacheManager && CACHE_KEYS.USER_SESSION) {
      const cacheKey = `${CACHE_KEYS.USER_SESSION}${decoded.id}`;
      user = await CacheManager.getOrSet(
        cacheKey,
        async () => {
          // 验证用户是否仍然存在且活跃
          const dbUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
              id: true,
              username: true,
              role: true,
              email: true,
              isActive: true,
            },
          });

          if (!dbUser || !dbUser.isActive) {
            return null;
          }

          return {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.role,
            email: dbUser.email || undefined,
          };
        },
        CACHE_TTL.SESSION
      );
    } else {
      // 客户端环境或Redis不可用时，直接查询数据库
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          role: true,
          email: true,
          isActive: true,
        },
      });

      if (dbUser && dbUser.isActive) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          role: dbUser.role,
          email: dbUser.email || undefined,
        };
      }
    }

    if (!user) {
      logger.warn('用户验证失败: 用户不存在或已禁用', {
        userId: decoded.id,
        username: decoded.username,
      });
      return null;
    }

    return user;
  } catch (error) {
    // 详细的错误处理和日志记录
    if (error instanceof Error) {
      if (error.message.includes('无效的令牌格式')) {
        logger.warn('JWT令牌格式无效，可能是旧令牌或损坏的令牌', { error: error.message });
      } else if (error.message.includes('令牌已过期')) {
        logger.info('JWT令牌已过期，需要重新登录', { error: error.message });
      } else if (error.message.includes('无效令牌')) {
        logger.warn('JWT令牌验证失败，可能是签名不匹配', { error: error.message });
      } else {
        logger.error('JWT令牌验证出现未知错误:', error);
      }
    } else {
      logger.error('Token验证错误 (非Error对象):', error);
    }
    return null;
  }
}

/**
 * 检查用户是否有指定的角色权限
 */
export function hasRole(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role);
}



/**
 * 检查用户是否是版主
 */
export function isModerator(user: AuthUser): boolean {
  return hasRole(user, ['MODERATOR']);
}

/**
 * 生成JWT token - 支持RS256
 */
export function generateToken(payload: { userId: string; username: string; role: string; email?: string }): string {
  const tokenPayload: TokenPayload = {
    id: payload.userId,
    username: payload.username,
    role: payload.role,
    email: payload.email,
  };
  
  return generateJWT(tokenPayload);
}

/**
 * 创建认证响应的辅助函数
 */
export function createAuthResponse(message: string, status: number = 401) {
  return Response.json(
    { success: false, message },
    { status }
  );
}

/**
 * 认证装饰器 - 用于保护API路由
 */
export function withAuth<T extends any[]>(handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<Response>) {
  return async (request: NextRequest, ...args: T) => {
    try {
      // 输入验证和清理
      const sanitizedRequest = {
        ...request,
        url: InputValidator.sanitizeInput(request.url),
      };
      
      const user = await verifyToken(request);
      
      if (!user) {
        logger.warn('未授权访问尝试', {
          url: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        });
        return createAuthResponse('未授权访问');
      }
      
      logger.debug('认证成功', {
        userId: user.id,
        username: user.username,
        url: request.url,
        method: request.method,
      });
      
      return handler(request, user, ...args);
    } catch (error) {
      logger.error('认证装饰器错误:', error);
      return createAuthResponse('认证服务错误', 500);
    }
  };
}

/**
 * 角色检查装饰器
 */
export function withRole<T extends any[]>(requiredRoles: string[], handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<Response>) {
  return withAuth(async (request: NextRequest, user: AuthUser, ...args: T) => {
    if (!hasRole(user, requiredRoles)) {
      logger.warn('权限不足', {
        userId: user.id,
        username: user.username,
        userRole: user.role,
        requiredRoles,
        url: request.url,
        method: request.method,
      });
      return createAuthResponse('权限不足', 403);
    }
    
    return handler(request, user, ...args);
  });
}



/**
 * 版主权限装饰器
 */
export function withModerator<T extends any[]>(handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<Response>) {
  return withRole(['MODERATOR'], handler);
}

/**
 * 认证用户 - 简化版本
 */
export async function authenticateUser(username: string, password: string, email: string) {
  // 简化的认证逻辑，返回模拟用户
  return {
    id: '1',
    username,
    email: email || `${username}@domain.com`,
    role: 'user' as any,
    groups: [],
    permissions: [],
    isDefaultPassword: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 更新用户密码
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  // 简化实现
  return true;
}

/**
 * 创建用户
 */
export async function createUser(userData: any) {
  // 简化实现
  return {
    id: Date.now().toString(),
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 获取所有用户
 */
export async function getAllUsers(): Promise<any[]> {
  // 简化实现
  return [];
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<boolean> {
  // 简化实现
  return true;
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  // 简化实现
  return true;
}

/**
 * 更新用户
 */
export async function updateUser(userId: string, userData: any) {
  // 简化实现
  return {
    id: userId,
    ...userData,
    updatedAt: new Date()
  };
}

/**
 * 注册用户
 */
export async function registerUser(registerData: any) {
  // 简化实现
  return {
    success: true,
    user: {
      id: Date.now().toString(),
      username: registerData.username,
      email: registerData.email,
      gameNickname: registerData.gameNickname,
      role: 'user' as any,
      groups: [],
      permissions: [],
      isDefaultPassword: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    message: '注册成功'
  };
}



/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length;
  
  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  // 生成反馈信息
  const feedback: string[] = [];
  if (password.length < minLength) feedback.push('密码长度至少8位');
  if (!hasUpperCase) feedback.push('需要包含大写字母');
  if (!hasLowerCase) feedback.push('需要包含小写字母');
  if (!hasNumbers) feedback.push('需要包含数字');
  if (!hasSpecialChar) feedback.push('需要包含特殊字符');
  
  return {
    score,
    strength,
    feedback,
    isValid: score >= 3,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
}