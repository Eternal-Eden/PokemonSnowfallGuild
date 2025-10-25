/**
 * JWT认证中间件 - 支持RS256算法
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { logger } from '../../src/lib/logger';
// 暂时注释掉Redis依赖
// import { loginAttemptLimiter } from '../../src/lib/security';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        email?: string;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  username: string;
  role: string;
  email?: string;
  iat: number;
  exp: number;
}

/**
 * 验证JWT令牌中间件 - 支持RS256和HS256
 */
export const authenticateToken = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn('认证失败: 缺少访问令牌', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
      });
      
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    // 使用升级后的JWT验证函数
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };

    logger.debug('用户认证成功', {
      userId: decoded.id,
      username: decoded.username,
      role: decoded.role,
    });

    next();
  } catch (error) {
    logger.warn('认证失败', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });
    
    if (error instanceof Error) {
      if (error.message.includes('过期')) {
        res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.message.includes('无效')) {
        res.status(403).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        res.status(403).json({
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
};

/**
 * 可选的JWT验证中间件（不强制要求token）
 */
export const optionalAuth = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          email: decoded.email
        };
        
        logger.debug('可选认证成功', {
          userId: decoded.id,
          username: decoded.username,
        });
      } catch (error) {
        // 忽略token验证错误，继续处理请求
        logger.debug('可选认证失败，继续处理请求', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * 角色权限验证中间件
 */
export const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: NextFunction) => {
    if (!req.user) {
      logger.warn('权限验证失败: 用户未认证', {
        ip: req.ip,
        url: req.originalUrl,
        requiredRoles: roles,
      });
      
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('权限验证失败: 权限不足', {
        userId: req.user.id,
        username: req.user.username,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        url: req.originalUrl,
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    logger.debug('权限验证成功', {
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      requiredRoles: roles,
    });

    next();
  };
};

/**
 * 登录尝试限制中间件
 */
export const loginRateLimit = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    // 暂时禁用Redis依赖的登录限制，直接允许通过
    logger.info('登录限制检查已暂时禁用（Redis不可用）');
    next();
  } catch (error) {
    logger.error('登录限制检查失败:', error);
    next(); // 发生错误时允许继续
  }
};

/**
 * 记录失败登录尝试
 */
export const recordFailedLogin = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    // 暂时禁用Redis依赖的失败登录记录
    logger.info('失败登录记录已暂时禁用（Redis不可用）');
  } catch (error) {
    logger.error('记录失败登录尝试失败:', error);
  }
};

/**
 * 清除登录尝试记录
 */
export const clearLoginAttempts = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    // 暂时禁用Redis依赖的登录尝试清除
    logger.info('登录尝试清除已暂时禁用（Redis不可用）');
  } catch (error) {
    logger.error('清除登录尝试记录失败:', error);
  }
};

/**
 * 版主权限验证
 */
export const requireModerator: RequestHandler = requireRole(['MODERATOR']);

/**
 * 细粒度权限验证中间件
 */
export const requirePermission = (permission: string) => {
  return async (req: any, res: any, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // 这里可以从数据库查询用户的具体权限
    // 暂时基于角色进行简单的权限判断
    const rolePermissions: Record<string, string[]> = {
      'MODERATOR': [
        'manage_users',
        'manage_content',
        'moderate_content',
        'manage_reports',
        'view_analytics'
      ],
      'USER': [
        'create_content',
        'comment',
        'like'
      ],
      'MEMBER': [
        'create_content',
        'comment',
        'like'
      ]
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      logger.warn('权限验证失败: 缺少所需权限', {
        userId: req.user.id,
        username: req.user.username,
        userRole: req.user.role,
        requiredPermission: permission,
        userPermissions,
        ip: req.ip,
        url: req.originalUrl,
      });
      
      res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`
      });
      return;
    }

    logger.debug('权限验证成功', {
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      requiredPermission: permission,
    });

    next();
  };
};

/**
 * 资源所有者验证中间件
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: any, res: any, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // 版主可以访问所有资源
    if (req.user.role === 'MODERATOR') {
      next();
      return;
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // 这里应该从数据库查询资源的所有者
    // 暂时简单比较ID
    if (resourceId !== userId) {
      logger.warn('资源访问被拒绝: 非资源所有者', {
        userId,
        username: req.user.username,
        resourceId,
        ip: req.ip,
        url: req.originalUrl,
      });
      
      res.status(403).json({
        success: false,
        error: 'Access denied: not resource owner'
      });
      return;
    }

    next();
  };
};

/**
 * API访问频率限制中间件
 */
export const apiRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: any, res: any, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理过期记录
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < now) {
        requests.delete(key);
      }
    }

    const clientRequests = requests.get(clientId);
    
    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (clientRequests.count >= maxRequests) {
      logger.warn('API访问频率限制', {
        clientId,
        count: clientRequests.count,
        maxRequests,
        resetTime: clientRequests.resetTime,
        url: req.originalUrl,
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
      return;
    }

    clientRequests.count++;
    next();
  };
};

/**
 * 操作日志记录中间件
 */
export const logOperation = (action: string, module: string) => {
  return async (req: any, res: any, next: NextFunction) => {
    // 记录操作开始
    const startTime = Date.now();
    
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法以捕获响应
    res.json = function(body: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 记录操作日志
      if (req.user && res.statusCode < 400) {
        logger.info('操作记录', {
          userId: req.user.id,
          username: req.user.username,
          action,
          module,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          targetId: req.params.id,
        });
      }
      
      // 调用原始的json方法
      return originalJson.call(this, body);
    };
    
    next();
  };
};