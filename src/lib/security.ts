/**
 * 安全中间件和工具
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS } from './redis';
import { logger } from './logger';

// 请求频率限制配置
interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyGenerator?: (request: NextRequest) => string; // 自定义键生成器
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

// 默认频率限制配置
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100次请求
};

// 登录尝试限制配置
const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: parseInt(process.env.LOCKOUT_TIME || '900000'), // 15分钟
  maxRequests: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'), // 5次尝试
};

/**
 * 请求频率限制中间件
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT, ...config };
  }

  /**
   * 生成缓存键
   */
  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // 默认使用IP地址
    const ip = this.getClientIP(request);
    return `${CACHE_KEYS.RATE_LIMIT}${ip}`;
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return 'unknown';
  }

  /**
   * 检查请求是否超过频率限制
   */
  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  }> {
    const key = this.generateKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // 获取当前计数
      const current = await redis.get<number>(key) || 0;
      
      if (current >= this.config.maxRequests) {
        // 超过限制
        const client = redis.getClient();
        const ttl = client ? await client.ttl(key) : 0;
        const resetTime = now + (ttl * 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          total: current,
        };
      }

      // 增加计数
      const newCount = await redis.incr(key);
      
      // 如果是第一次请求，设置过期时间
      if (newCount === 1) {
        await redis.expire(key, Math.ceil(this.config.windowMs / 1000));
      }

      return {
        allowed: true,
        remaining: Math.max(0, this.config.maxRequests - newCount),
        resetTime: now + this.config.windowMs,
        total: newCount,
      };
    } catch (error) {
      logger.error('频率限制检查失败:', error);
      // 发生错误时允许请求通过
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        total: 0,
      };
    }
  }

  /**
   * 创建频率限制中间件
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkLimit(request);
      
      if (!result.allowed) {
        logger.warn('请求频率超限:', {
          ip: this.getClientIP(request),
          url: request.url,
          userAgent: request.headers.get('user-agent'),
        });
        
        return NextResponse.json(
          {
            success: false,
            message: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // 添加频率限制头部
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      
      return null; // 继续处理请求
    };
  }
}

/**
 * 登录尝试限制器
 */
export class LoginAttemptLimiter {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter({
      ...LOGIN_RATE_LIMIT,
      keyGenerator: (request: NextRequest) => {
        const ip = this.getClientIP(request);
        return `${CACHE_KEYS.LOGIN_ATTEMPTS}${ip}`;
      },
    });
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || 'unknown';
  }

  /**
   * 检查登录尝试是否被限制
   */
  async checkLoginAttempt(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const result = await this.rateLimiter.checkLimit(request);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  }

  /**
   * 记录失败的登录尝试
   */
  async recordFailedAttempt(request: NextRequest): Promise<void> {
    await this.rateLimiter.checkLimit(request);
  }

  /**
   * 清除登录尝试记录（登录成功时调用）
   */
  async clearAttempts(request: NextRequest): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `${CACHE_KEYS.LOGIN_ATTEMPTS}${ip}`;
    await redis.del(key);
  }
}

/**
 * 安全头部中间件
 */
export function securityHeaders(): (request: NextRequest) => NextResponse {
  return (request: NextRequest): NextResponse => {
    const response = NextResponse.next();
    
    // 设置安全头部
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // 内容安全策略
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
    
    // HTTPS重定向（生产环境）
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    return response;
  };
}

/**
 * 输入验证和清理
 */
export class InputValidator {
  /**
   * 清理HTML内容，防止XSS攻击
   */
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    
    // 基本的HTML实体编码
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 验证SQL注入模式
   */
  static containsSqlInjection(input: string): boolean {
    if (!input) return false;
    
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // 移除潜在的恶意字符
      return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
        .substring(0, 10000); // 限制长度
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

/**
 * 创建全局频率限制器实例
 */
export const globalRateLimiter = new RateLimiter();
export const loginAttemptLimiter = new LoginAttemptLimiter();

/**
 * 安全中间件组合
 */
export function createSecurityMiddleware() {
  return {
    rateLimit: globalRateLimiter.middleware(),
    securityHeaders: securityHeaders(),
    loginLimit: loginAttemptLimiter,
  };
}