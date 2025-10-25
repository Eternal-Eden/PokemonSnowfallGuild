import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth';

type HandlerFunction = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

/**
 * API 认证中间件包装器
 * 用于保护管理API路由
 */
export function withAuth(handler: HandlerFunction) {
  return async function(request: NextRequest, ...args: unknown[]) {
    // 执行认证检查
    const authResult = authMiddleware(request);
    
    // 如果认证失败，返回错误响应
    if (authResult) {
      return authResult;
    }
    
    // 认证成功，继续执行原始处理函数
    return handler(request, ...args);
  };
}

/**
 * 速率限制中间件
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return function(handler: HandlerFunction) {
    return async function(request: NextRequest, ...args: unknown[]) {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const key = `${clientIp}:${request.nextUrl.pathname}`;
      
      const current = rateLimitMap.get(key);
      
      if (!current || now > current.resetTime) {
        // 重置计数器
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      } else if (current.count >= maxRequests) {
        // 超过限制
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      } else {
        // 增加计数
        current.count++;
      }
      
      return handler(request, ...args);
    };
  };
}

/**
 * 错误处理中间件
 */
export function withErrorHandling(handler: HandlerFunction) {
  return async function(request: NextRequest, ...args: unknown[]) {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // 根据错误类型返回不同的响应
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
        
        if (error.message.includes('Not Found')) {
          return NextResponse.json(
            { error: 'Not Found' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * CORS 中间件
 */
export function withCors(handler: HandlerFunction, options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
} = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false
  } = options;

  return async function(request: NextRequest, ...args: unknown[]) {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      const headers = new Headers();
      
      if (typeof origin === 'string') {
        headers.set('Access-Control-Allow-Origin', origin);
      } else if (Array.isArray(origin)) {
        const requestOrigin = request.headers.get('origin');
        if (requestOrigin && origin.includes(requestOrigin)) {
          headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      }
      
      headers.set('Access-Control-Allow-Methods', methods.join(', '));
      headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      return new NextResponse(null, { status: 200, headers });
    }
    
    // 执行原始处理函数
    const response = await handler(request, ...args);
    
    // 添加 CORS 头部
    if (typeof origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  };
}

/**
 * 日志中间件
 */
export function withLogging(handler: HandlerFunction) {
  return async function(request: NextRequest, ...args: unknown[]) {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Start`);
    
    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - start;
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${new Date().toISOString()}] ${method} ${url} - Error (${duration}ms):`, error);
      throw error;
    }
  };
}

/**
 * 请求验证中间件
 */
export function withValidation(schema: Record<string, unknown>) {
  return function(handler: HandlerFunction) {
    return async function(request: NextRequest, ...args: unknown[]) {
      try {
        // 这里可以添加具体的验证逻辑
        // 例如使用 Joi 或 Zod 进行验证
        
        // 简单的验证示例
        if (request.method === 'POST' || request.method === 'PUT') {
          const body = await request.json();
          
          // 验证必需字段
          for (const [key, value] of Object.entries(schema)) {
            if (value === 'required' && !body[key]) {
              return NextResponse.json(
                { error: `Missing required field: ${key}` },
                { status: 400 }
              );
            }
          }
        }
        
        return handler(request, ...args);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    };
  };
}

/**
 * 中间件组合器
 */
export function compose(...middlewares: Array<(handler: HandlerFunction) => HandlerFunction>) {
  return function(handler: HandlerFunction) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * 公共中间件组合
 */
export function withPublicMiddleware(handler: HandlerFunction) {
  return compose(
    withErrorHandling,
    withLogging,
    withCors
  )(handler);
}