import { Request, Response } from 'express'
import { getPrismaClient } from '../utils/database'
import { logger } from '../utils/logger'
import bcrypt from 'bcryptjs'

/**
 * 获取用户列表
 */
export const getUserList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      role,
      keyword,
      startDate,
      endDate
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (status) {
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'inactive') {
        where.isActive = false
      }
    }
    
    if (role) {
      where.role = role
    }
    
    if (keyword) {
      where.OR = [
        { username: { contains: keyword as string, mode: 'insensitive' } },
        { gameNickname: { contains: keyword as string, mode: 'insensitive' } },
        { email: { contains: keyword as string, mode: 'insensitive' } }
      ]
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }
    
    // 获取用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          profile: {
            select: {
              avatar: true,
              bio: true,
              location: true
            }
          },
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])
    
    // 过滤敏感信息
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      gameNickname: user.gameNickname,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      _count: user._count
    }))
    
    res.status(200).json({
      success: true,
      data: {
        users: safeUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get user list error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取用户详情
 */
export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const prisma = getPrismaClient()
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      }
    })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 过滤敏感信息
    const safeUser = {
      id: user.id,
      username: user.username,
      gameNickname: user.gameNickname,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      _count: user._count
    }
    
    res.status(200).json({
      success: true,
      data: { user: safeUser }
    })
    
  } catch (error) {
    logger.error('Get user detail error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 创建用户
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      gameNickname,
      role = 'USER',
      avatar
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: email || undefined }
        ]
      }
    })
    
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      })
      return
    }
    
    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        username,
        gameNickname: gameNickname || username,
        email: email || null,
        passwordHash: hashedPassword,
        role,
        isActive: true
      },
      include: {
        profile: true
      }
    })
    
    // 创建用户资料
    await prisma.userProfile.create({
      data: {
        userId: newUser.id,
        avatar: avatar || null
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'CREATE_USER',
        module: 'USER',
        description: `创建用户 ${username}，角色：${role}`,
        targetId: newUser.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User created', { userId: newUser.id, username, operatorId: operator.id })
    
    // 返回安全的用户信息
    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      gameNickname: newUser.gameNickname,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: safeUser }
    })
    
  } catch (error) {
    logger.error('Create user error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新用户信息
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      username,
      email,
      gameNickname,
      role,
      avatar,
      bio,
      location
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 检查用户名和邮箱是否被其他用户使用
    if (username || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                username ? { username } : {},
                email ? { email } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      })
      
      if (conflictUser) {
        res.status(409).json({
          success: false,
          error: 'Username or email already exists'
        })
        return
      }
    }
    
    // 更新用户基本信息
    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (gameNickname !== undefined) updateData.gameNickname = gameNickname
    if (role !== undefined) updateData.role = role
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true
      }
    })
    
    // 更新用户资料
    const profileUpdateData: any = {}
    if (avatar !== undefined) profileUpdateData.avatar = avatar
    if (bio !== undefined) profileUpdateData.bio = bio
    if (location !== undefined) profileUpdateData.location = location
    
    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId: id },
        update: profileUpdateData,
        create: {
          userId: id,
          ...profileUpdateData
        }
      })
    }
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_USER',
        module: 'USER',
        description: `更新用户 ${existingUser.username} 的信息`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User updated', { userId: id, operatorId: operator.id })
    
    // 返回安全的用户信息
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      gameNickname: updatedUser.gameNickname,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      profile: updatedUser.profile
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: safeUser }
    })
    
  } catch (error) {
    logger.error('Update user error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新用户状态
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, reason, banDuration } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 更新用户状态
    const updateData: any = {}
    
    if (status === 'active') {
      updateData.isActive = true
      updateData.bannedAt = null
      updateData.banReason = null
      updateData.banExpiresAt = null
    } else if (status === 'banned') {
      updateData.isActive = false
      updateData.bannedAt = new Date()
      updateData.banReason = reason
      if (banDuration) {
        updateData.banExpiresAt = new Date(Date.now() + banDuration * 60 * 60 * 1000)
      }
    } else if (status === 'inactive') {
      updateData.isActive = false
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_USER_STATUS',
        module: 'USER',
        description: `将用户 ${user.username} 状态更改为 ${status}${reason ? `，原因：${reason}` : ''}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User status updated', { userId: id, status, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: { user: updatedUser }
    })
    
  } catch (error) {
    logger.error('Update user status error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 重置用户密码
 */
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 加密新密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    
    // 更新密码
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'RESET_USER_PASSWORD',
        module: 'USER',
        description: `重置用户 ${user.username} 的密码`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User password reset', { userId: id, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    })
    
  } catch (error) {
    logger.error('Reset user password error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取用户活动记录
 */
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const {
      page = 1,
      limit = 20,
      type
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {
      OR: [
        { operatorId: userId },
        { targetId: userId }
      ]
    }
    
    if (type) {
      where.action = { contains: type as string }
    }
    
    // 获取活动记录
    const [activities, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          operator: {
            select: {
              username: true,
              gameNickname: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.operationLog.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get user activity error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取用户统计数据
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    const prisma = getPrismaClient()
    
    // 构建日期查询条件
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate as string)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string)
    }
    
    // 获取统计数据
    const [totalUsers, activeUsers, newUsers, bannedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        }
      }),
      prisma.user.count({ where: { isActive: false } })
    ])
    
    // 按角色统计
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsers,
          bannedUsers
        },
        roleStats
      }
    })
    
  } catch (error) {
    logger.error('Get user stats error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新用户角色
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { role } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_USER',
        module: 'USER',
        description: `将用户 ${user.username} 的角色更改为 ${role}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User role updated', { userId: id, role, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
    })
    
  } catch (error) {
    logger.error('Update user role error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 批量更新用户状态
 */
export const batchUpdateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIds, status, reason } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid user IDs'
      })
      return
    }
    
    // 构建更新数据
    const updateData: any = {}
    
    if (status === 'active') {
      updateData.isActive = true
      updateData.bannedAt = null
      updateData.banReason = null
      updateData.banExpiresAt = null
    } else if (status === 'banned') {
      updateData.isActive = false
      updateData.bannedAt = new Date()
      updateData.banReason = reason
    } else if (status === 'inactive') {
      updateData.isActive = false
    }
    
    // 批量更新用户状态
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: updateData
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'BATCH_UPDATE_USER_STATUS',
        module: 'USER',
        description: `批量将 ${userIds.length} 个用户状态更改为 ${status}${reason ? `，原因：${reason}` : ''}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Batch user status updated', { userIds, status, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.count} users`,
      data: { updatedCount: result.count }
    })
    
  } catch (error) {
    logger.error('Batch update user status error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 删除用户
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 软删除用户（标记为已删除）
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'DELETE_USER',
        module: 'USER',
        description: `删除用户 ${user.username}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('User deleted', { userId: id, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
    
  } catch (error) {
    logger.error('Delete user error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}