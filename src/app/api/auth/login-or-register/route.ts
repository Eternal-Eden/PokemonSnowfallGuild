import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateToken } from '@/lib/auth';
import { loginAttemptLimiter, InputValidator } from '@/lib/security';
import { securityMonitor, MonitoringEventType } from '@/lib/monitoring';
import { CacheManager } from '@/lib/redis';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// 请求验证schema - 简化版本，移除验证码和游戏昵称
const loginOrRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email(),
  twoFactorCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  try {
    // 1. 检查登录尝试限制
    const loginLimitCheck = await loginAttemptLimiter.checkLoginAttempt(request);
    if (!loginLimitCheck.allowed) {
      await securityMonitor.logEvent({
        type: MonitoringEventType.RATE_LIMIT_HIT,
        ip,
        userAgent,
        url: request.url,
        method: request.method,
        severity: 'medium',
        details: {
          reason: 'login_attempts_exceeded',
          remaining: loginLimitCheck.remaining,
          resetTime: loginLimitCheck.resetTime,
        },
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: '登录尝试过于频繁，请稍后再试',
          retryAfter: Math.ceil((loginLimitCheck.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // 2. 解析和验证请求数据
    const body = await request.json();
    const sanitizedBody = InputValidator.sanitizeInput(body);
    const validatedData = loginOrRegisterSchema.parse(sanitizedBody);
    
    const { username, password, email, twoFactorCode } = validatedData;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        stats: true,
        privacySettings: true,
      },
    });

    if (existingUser) {
      // 用户存在，执行登录逻辑
      const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
      
      if (!isPasswordValid) {
        // 记录失败的登录尝试
        await loginAttemptLimiter.recordFailedAttempt(request);
        
        await securityMonitor.logEvent({
          type: MonitoringEventType.AUTH_FAILURE,
          ip,
          userAgent,
          url: request.url,
          method: request.method,
          statusCode: 401,
          severity: 'medium',
          details: {
            username,
            reason: 'invalid_password',
          },
        });
        
        logger.warn('登录失败: 密码错误', {
          username,
          ip,
          userAgent,
        });
        
        return NextResponse.json(
          { success: false, message: '用户名或密码错误' },
          { status: 401 }
        );
      }

      // 检查双因素验证
      if (existingUser.twoFactorEnabled && !twoFactorCode) {
        return NextResponse.json({
          success: false,
          requiresTwoFactor: true,
          message: '需要双因素验证码',
        });
      }

      // 清除登录尝试记录（登录成功）
      await loginAttemptLimiter.clearAttempts(request);
      
      // 更新最后登录时间
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      });

      // 生成JWT token（使用RS256）
      const token = generateToken({
        userId: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
        email: existingUser.email || undefined,
      });
      
      // 清除用户相关缓存
      await CacheManager.clearUserCache(existingUser.id);
      
      // 记录成功登录
      await securityMonitor.logEvent({
        type: MonitoringEventType.AUTH_SUCCESS,
        ip,
        userAgent,
        url: request.url,
        method: request.method,
        userId: existingUser.id,
        username: existingUser.username,
        statusCode: 200,
        severity: 'low',
        details: {
          loginType: 'existing_user',
          role: existingUser.role,
        },
      });
      
      logger.info('用户登录成功', {
        userId: existingUser.id,
        username: existingUser.username,
        ip,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
          avatarUrl: existingUser.avatarUrl,
          emailVerified: existingUser.emailVerified,
        },
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        isNewUser: false,
        requirePasswordChange: existingUser.requirePasswordChange,
      });
    } else {
      // 用户不存在，执行注册逻辑
      // 检查邮箱是否已被使用
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmailUser) {
        return NextResponse.json(
          { success: false, message: '该邮箱已被注册' },
          { status: 400 }
        );
      }

      // 创建新用户
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash: hashedPassword,
          emailVerified: true,
          isDefaultPassword: false,
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
        include: {
          profile: true,
          stats: true,
          privacySettings: true,
        },
      });



      // 生成JWT token（使用RS256）
      const token = generateToken({
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email || undefined,
      });
      
      // 记录成功注册
      await securityMonitor.logEvent({
        type: MonitoringEventType.AUTH_SUCCESS,
        ip,
        userAgent,
        url: request.url,
        method: request.method,
        userId: newUser.id,
        username: newUser.username,
        statusCode: 200,
        severity: 'low',
        details: {
          loginType: 'new_user_registration',
          role: newUser.role,
          email: newUser.email,
        },
      });
      
      logger.info('新用户注册成功', {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        ip,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
          emailVerified: newUser.emailVerified,
        },
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        isNewUser: true,
        requirePasswordChange: false,
      });
    }
  } catch (error: unknown) {
    // 记录错误事件
    await securityMonitor.logEvent({
      type: MonitoringEventType.ERROR_OCCURRED,
      ip,
      userAgent,
      url: request.url,
      method: request.method,
      statusCode: 500,
      severity: 'high',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    
    logger.error('登录/注册错误:', error);
    
    if (error instanceof z.ZodError) {
      // 将Zod错误转换为更友好的中文错误信息
      const friendlyErrors = error.issues.map(issue => {
        const field = issue.path[0];
        switch (field) {
          case 'username':
            if (issue.code === 'too_small') {
              return '用户名至少需要3个字符';
            } else if (issue.code === 'too_big') {
              return '用户名不能超过50个字符';
            }
            return '用户名格式不正确';
          case 'password':
            if (issue.code === 'too_small') {
              return '密码至少需要6个字符';
            }
            return '密码格式不正确';
          case 'email':
            return '请输入有效的邮箱地址';
          default:
            return issue.message;
        }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: friendlyErrors[0] || '请求参数无效',
          errors: friendlyErrors
        },
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