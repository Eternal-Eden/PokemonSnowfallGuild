/**
 * Next.js 中间件 - 全局安全防护
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, securityHeaders, InputValidator } from './src/lib/security';
import { logger } from './src/lib/logger';

// 需要频率限制的路径
const RATE_LIMITED_PATHS = [
  '/api/auth/login-or-register',
  '/api/auth/send-verification-code',
  '/api/auth/verify-code',
  '/api/auth/change-password',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/users',
  '/api/forum/posts',
  '/api/messages',
];

// 需要特殊保护的敏感路径
const SENSITIVE_PATHS = [
  '/api/auth',
  '/api/users/stats',
];

// 静态资源路径（跳过中间件）
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/uploads',
  '/thumbnails',
  '/avatars',
];

/**
 * 检查路径是否需要频率限制
 */
function shouldRateLimit(pathname: string): boolean {
  return RATE_LIMITED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 检查路径是否为敏感路径
 */
function isSensitivePath(pathname: string): boolean {
  return SENSITIVE_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 检查路径是否为静态资源
 */
function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 验证请求安全性
 */
function validateRequestSecurity(request: NextRequest): { isValid: boolean; reason?: string } {
  const { pathname, search } = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // 检查恶意用户代理
  const maliciousUserAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'nessus',
    'openvas',
    'w3af',
    'burpsuite',
  ];
  
  if (maliciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return { isValid: false, reason: 'Malicious user agent detected' };
  }
  
  // 检查SQL注入模式
  const fullUrl = pathname + search;
  if (InputValidator.containsSqlInjection(fullUrl)) {
    return { isValid: false, reason: 'SQL injection pattern detected' };
  }
  
  // 检查路径遍历攻击
  if (pathname.includes('../') || pathname.includes('..\\')) {
    return { isValid: false, reason: 'Path traversal attack detected' };
  }
  
  // 检查过长的URL（可能的DoS攻击）
  if (request.url.length > 2048) {
    return { isValid: false, reason: 'URL too long' };
  }
  
  return { isValid: true };
}

/**
 * 记录安全事件
 */
function logSecurityEvent(request: NextRequest, event: string, details?: any) {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            request.headers.get('cf-connecting-ip') || 
            'unknown';
  
  logger.warn(`安全事件: ${event}`, {
    ip,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * 主中间件函数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // 跳过静态资源
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }
  
  try {
    // 1. 安全验证
    const securityCheck = validateRequestSecurity(request);
    if (!securityCheck.isValid) {
      logSecurityEvent(request, 'Security validation failed', {
        reason: securityCheck.reason,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: '请求被安全策略拒绝',
          code: 'SECURITY_VIOLATION'
        },
        { status: 400 }
      );
    }
    
    // 2. 频率限制检查
    if (shouldRateLimit(pathname)) {
      const rateLimitResult = await globalRateLimiter.checkLimit(request);
      
      if (!rateLimitResult.allowed) {
        logSecurityEvent(request, 'Rate limit exceeded', {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          total: rateLimitResult.total,
        });
        
        return NextResponse.json(
          {
            success: false,
            message: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }
    
    // 3. 已移除管理员认证检查
    
    // 4. 敏感路径额外保护
    if (isSensitivePath(pathname)) {
      // 检查是否有认证头
      const authHeader = request.headers.get('authorization');
      if (!authHeader && !pathname.includes('/login')) {
        logSecurityEvent(request, 'Unauthorized access to sensitive path');
      }
      
      // 记录敏感路径访问
      logger.info('敏感路径访问', {
        path: pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        hasAuth: !!authHeader,
      });
    }
    
    // 5. 应用安全头部
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://v1.hitokoto.cn",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: ws:",
      "media-src 'self' blob:",
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
    
    // 添加频率限制头部（如果适用）
    if (shouldRateLimit(pathname)) {
      const rateLimitResult = await globalRateLimiter.checkLimit(request);
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    }
    
    // 添加自定义安全头部
    response.headers.set('X-Powered-By', 'PokemonSnowfallGuild');
    response.headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    return response;
    
  } catch (error) {
    logger.error('中间件处理错误:', error);
    
    // 发生错误时返回通用错误响应
    return NextResponse.json(
      { 
        success: false, 
        message: '服务暂时不可用，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

/**
 * 中间件配置
 */
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export default middleware;