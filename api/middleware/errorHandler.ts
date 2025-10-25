/**
 * 错误处理中间件
 */
import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// 认证错误类
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

// 授权错误类
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

// 资源未找到错误类
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// 冲突错误类
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: Error,
  req: any,
  res: any,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // 记录错误日志
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 处理自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // 处理Prisma错误
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint violation';
        details = prismaError.meta;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }
  // 处理JWT错误
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // 处理验证错误
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = error.message;
  }
  // 处理语法错误
  else if (error instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }

  // 在开发环境中包含错误堆栈
  const response: any = {
    success: false,
    error: message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 异步错误处理包装器
 */
export const asyncHandler = (
  fn: (req: any, res: any, next: NextFunction) => Promise<any>
) => {
  return (req: any, res: any, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (
  req: any,
  res: any,
  next: NextFunction
): void => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};