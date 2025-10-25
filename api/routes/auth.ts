/**
 * 用户认证路由
 * 处理用户登录即注册、邮箱验证、密码管理等功能
 */
import { Router } from 'express';
import { validate } from '../utils/validation';
import { authSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { getPrismaClient } from '../utils/database';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * 登录即注册
 * POST /api/auth/login-or-register
 */
router.post('/login-or-register', 
  validate(authSchemas.loginOrRegister),
  asyncHandler(async (req, res) => {
    const { username, password, email, twoFactorCode } = req.body;
    
    logger.info('Login or register attempt', { username, hasEmail: !!email });
    
    const prisma = getPrismaClient();
    
    try {
      // 1. 检查用户是否存在
      let user = await prisma.user.findUnique({
        where: { username },
        include: {
          profile: true
        }
      }) as any;
      
      if (user) {
        // 用户存在，验证密码并登录
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
          res.status(401).json({
            success: false,
            error: 'Invalid username or password'
          });
          return;
        }
        
        if (!user.isActive) {
          res.status(403).json({
            success: false,
            error: 'Account is deactivated'
          });
          return;
        }
        
        // 生成JWT令牌
        const token = generateToken({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email || undefined
        });
        
        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
        
        logger.info('User login successful', { userId: user.id, username });
        
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              profile: user.profile
            },
            isNewUser: false
          }
        });
      } else {
        // 用户不存在，创建新用户）
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // 创建新用户
        const newUser = await prisma.user.create({
          data: {
            username,
            passwordHash: hashedPassword,
            email: email || null,
            role: 'USER',
            isActive: true
          },
          include: {
            profile: true
          }
        }) as any;
        
        // 创建用户资料
        await prisma.userProfile.create({
          data: {
            userId: newUser.id
          }
        });
        
        // 生成JWT令牌
        const token = generateToken({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email || undefined
        });
        
        logger.info('User registration successful', { userId: newUser.id, username });
        
        res.status(201).json({
          success: true,
          message: 'Registration successful',
          data: {
            token,
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              role: newUser.role,
              profile: null // 刚创建，还没有完整的profile数据
            },
            isNewUser: true
          }
        });
      }
    } catch (error) {
      logger.error('Login or register error', { error: error instanceof Error ? error.message : error, username });
      
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({
          success: false,
          error: 'Username or email already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  })
);





/**
 * 修改密码
 * POST /api/auth/change-password
 */
router.post('/change-password',
  authenticateToken,
  validate(authSchemas.changePassword),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    
    logger.info('Password change attempt', { userId });
    
    const prisma = getPrismaClient();
    
    try {
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // 1. 获取用户信息并验证当前密码
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
        return;
      }
      
      // 2. 加密新密码
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // 3. 更新数据库
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          isDefaultPassword: false,
          requirePasswordChange: false,
          updatedAt: new Date()
        }
      });
      
      // 4. 使所有现有的刷新令牌失效
      await prisma.userSession.deleteMany({
        where: { userId }
      });
      
      logger.info('Password changed successfully', { userId });
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error', { error: error instanceof Error ? error.message : error, userId });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

/**
 * 请求密码重置
 * POST /api/auth/request-password-reset
 */
router.post('/request-password-reset',
  validate(authSchemas.sendVerificationCode), // 复用邮箱验证
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    logger.info('Password reset request', { email });
    
    const prisma = getPrismaClient();
    
    try {
      // 1. 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      // 为了安全起见，无论用户是否存在都返回相同的响应
      if (user) {
        // 2. 生成重置令牌（使用crypto生成安全的随机字符串）
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // 3. 删除该用户的旧重置令牌
        await prisma.passwordResetToken.deleteMany({
          where: { userId: user.id }
        });
        
        // 4. 存储重置令牌（1小时有效期）
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt
          }
        });
        
        // 5. 发送重置邮件
        const { sendPasswordResetEmail } = await import('../utils/email');
        const emailSent = await sendPasswordResetEmail(email, user.username, resetToken);
        
        if (!emailSent) {
          logger.warn('Failed to send password reset email', { email, userId: user.id });
        }
        
        logger.info('Password reset token generated', { userId: user.id, email });
      }
      
      // 无论用户是否存在都返回相同响应，避免邮箱枚举攻击
      res.status(200).json({
        success: true,
        message: 'Password reset email sent if account exists'
      });
    } catch (error) {
      logger.error('Request password reset error', { error: error instanceof Error ? error.message : error, email });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

/**
 * 重置密码
 * POST /api/auth/reset-password
 */
router.post('/reset-password',
  validate(authSchemas.resetPassword),
  asyncHandler(async (req, res) => {
    const { email, verificationCode, newPassword } = req.body;
    
    logger.info('Password reset attempt');
    
    const prisma = getPrismaClient();
    
    try {
      // 1. 验证重置令牌
       const resetTokenRecord = await prisma.passwordResetToken.findFirst({
         where: {
           token: verificationCode,
           isUsed: false
         }
       });
      
      if (!resetTokenRecord) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
        return;
      }
      
      // 2. 检查是否过期
      if (new Date() > resetTokenRecord.expiresAt) {
        res.status(400).json({
          success: false,
          error: 'Reset token has expired'
        });
        return;
      }
      
      // 3. 加密新密码
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // 4. 更新密码
      await prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: {
          passwordHash: hashedNewPassword,
          isDefaultPassword: false,
          requirePasswordChange: false,
          updatedAt: new Date()
        }
      });
      
      // 5. 标记令牌为已使用
      await prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      });
      
      // 6. 使所有现有的用户会话失效
      await prisma.userSession.deleteMany({
        where: { userId: resetTokenRecord.userId }
      });
      
      logger.info('Password reset successfully', { userId: resetTokenRecord.userId });
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

/**
 * 刷新令牌
 * POST /api/auth/refresh-token
 */
router.post('/refresh-token',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
      return;
    }
    
    logger.info('Token refresh attempt');
    
    const prisma = getPrismaClient();
    
    try {
      // 1. 验证刷新令牌
      const { verifyRefreshToken, generateToken, generateRefreshToken } = await import('../utils/jwt');
      
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
        return;
      }
      
      // 2. 检查用户会话是否存在且有效
      const session = await prisma.userSession.findUnique({
        where: {
          refreshToken,
          userId: payload.id
        }
      });
      
      if (!session) {
        res.status(401).json({
          success: false,
          error: 'Session not found or invalid'
        });
        return;
      }
      
      // 检查会话是否过期
      if (new Date() > session.expiresAt) {
        // 删除过期的会话
        await prisma.userSession.delete({
          where: { id: session.id }
        });
        
        res.status(401).json({
          success: false,
          error: 'Session expired'
        });
        return;
      }
      
      // 3. 获取最新的用户信息
      const user = await prisma.user.findUnique({
        where: { id: payload.id }
      });
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'User not found or inactive'
        });
        return;
      }
      
      // 4. 生成新的访问令牌
      const newAccessToken = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email || undefined
      });
      
      // 5. 生成新的刷新令牌（可选）
      const newRefreshToken = generateRefreshToken({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email || undefined
      });
      
      // 6. 更新会话信息
      const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: newExpiresAt,
          lastUsedAt: new Date()
        }
      });
      
      logger.info('Token refreshed successfully', { userId: user.id });
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: newExpiresAt.toISOString()
        }
      });
    } catch (error) {
      logger.error('Refresh token error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    
    logger.info('User logout', { userId });
    
    const prisma = getPrismaClient();
    
    try {
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // 1. 获取请求头中的令牌
      const authHeader = req.headers.authorization;
      const { extractTokenFromHeader } = await import('../utils/jwt');
      const accessToken = extractTokenFromHeader(authHeader);
      
      // 2. 清除用户会话（删除所有刷新令牌）
      const deletedSessions = await prisma.userSession.deleteMany({
        where: { userId }
      });
      
      // 3. 如果有Redis，可以将访问令牌加入黑名单
      // 这里暂时跳过Redis实现，因为访问令牌通常有较短的有效期
      
      // 4. 记录登出日志
      logger.info('User logout successful', {
        userId,
        deletedSessions: deletedSessions.count,
        accessToken: accessToken ? 'present' : 'missing'
      });
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error', { error: error instanceof Error ? error.message : error, userId });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    
    logger.info('Get current user info', { userId: user?.id });
    
    const prisma = getPrismaClient();
    
    try {
      if (!user?.id) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // 从数据库获取完整用户信息
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          stats: true,
          privacySettings: true
        }
      });
      
      if (!fullUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      if (!fullUser.isActive) {
        res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
        return;
      }
      
      // 返回用户信息（排除敏感数据）
      const userData = {
        id: fullUser.id,
        username: fullUser.username,
        gameNickname: fullUser.gameNickname,
        email: fullUser.email,
        role: fullUser.role,
        avatarUrl: fullUser.avatarUrl,
        uniqueId: fullUser.uniqueId,
        isDefaultPassword: fullUser.isDefaultPassword,
        requirePasswordChange: fullUser.requirePasswordChange,
        emailVerified: fullUser.emailVerified,
        twoFactorEnabled: fullUser.twoFactorEnabled,
        lastLoginAt: fullUser.lastLoginAt,
        createdAt: fullUser.createdAt,
        profile: fullUser.profile,
        stats: fullUser.stats,
        privacySettings: fullUser.privacySettings
      };
      
      logger.info('Get current user info successful', { userId: fullUser.id });
      
      res.status(200).json({
        success: true,
        data: userData
      });
    } catch (error) {
      logger.error('Get current user error', { error: error instanceof Error ? error.message : error, userId: user?.id });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      await prisma.$disconnect();
    }
  })
);

export default router;