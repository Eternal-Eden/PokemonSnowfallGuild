import { Request, Response } from 'express'
import { getPrismaClient } from '../utils/database'
import { logger } from '../utils/logger'
import { getClientIP, getUserAgent } from '../utils/request'

/**
 * 获取活动列表
 */
export const getActivityList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      keyword,
      organizerId,
      startDate,
      endDate
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { description: { contains: keyword as string, mode: 'insensitive' } }
      ]
    }
    
    if (organizerId) {
      where.organizerId = organizerId
    }
    
    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string)
      }
    }
    
    // 获取活动列表
    const [activities, total] = await Promise.all([
      prisma.forumActivity.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          participants: {
            include: {
              activity: false // 避免循环引用
            },
            take: 5 // 只返回前5个参与者
          },
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.forumActivity.count({ where })
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
    logger.error('Get activity list error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取活动详情（别名）
 */
export const getActivityById = async (req: Request, res: Response): Promise<void> => {
  return getActivityDetail(req, res);
};

/**
 * 获取活动详情
 */
export const getActivityDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const prisma = getPrismaClient()
    
    const activity = await prisma.forumActivity.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: {
            registeredAt: 'desc'
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })
    
    if (!activity) {
      res.status(404).json({
        success: false,
        error: 'Activity not found'
      })
      return
    }
    
    res.status(200).json({
      success: true,
      data: { activity }
    })
    
  } catch (error) {
    logger.error('Get activity detail error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 创建活动
 */
export const createActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      registrationDeadline,
      location,
      maxParticipants,
      rewards,
      restrictions
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 验证时间逻辑
    const start = new Date(startTime)
    const end = new Date(endTime)
    const regDeadline = new Date(registrationDeadline)
    
    if (start >= end) {
      res.status(400).json({
        success: false,
        error: 'Start time must be before end time'
      })
      return
    }
    
    if (regDeadline >= start) {
      res.status(400).json({
        success: false,
        error: 'Registration deadline must be before start time'
      })
      return
    }
    
    // 创建活动
    const newActivity = await prisma.forumActivity.create({
      data: {
        title,
        description,
        type,
        startTime: start,
        endTime: end,
        registrationDeadline: regDeadline,
        location,
        maxParticipants,
        currentParticipants: 0,
        rewards,
        restrictions,
        organizerId: operator.id,
        organizerName: operator.username
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'CREATE_POST',
        module: 'CONTENT',
        description: `创建活动 "${title}"`,
        targetId: newActivity.id,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      }
    })
    
    logger.info('Activity created', { activityId: newActivity.id, title, operatorId: operator.id })
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity: newActivity }
    })
    
  } catch (error) {
    logger.error('Create activity error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新活动信息
 */
export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      registrationDeadline,
      location,
      maxParticipants,
      rewards,
      restrictions
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查活动是否存在
    const activity = await prisma.forumActivity.findUnique({
      where: { id }
    })
    
    if (!activity) {
      res.status(404).json({
        success: false,
        error: 'Activity not found'
      })
      return
    }
    
    // 检查权限（只有组织者和版主可以修改）
    if (activity.organizerId !== operator.id && operator.role !== 'MODERATOR') {
      res.status(403).json({
        success: false,
        error: 'Permission denied'
      })
      return
    }
    
    // 验证时间逻辑（如果提供了时间参数）
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          error: 'Start time must be before end time'
        })
        return
      }
    }
    
    if (registrationDeadline && startTime) {
      const regDeadline = new Date(registrationDeadline)
      const start = new Date(startTime)
      
      if (regDeadline >= start) {
        res.status(400).json({
          success: false,
          error: 'Registration deadline must be before start time'
        })
        return
      }
    }
    
    // 构建更新数据
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline)
    if (location !== undefined) updateData.location = location
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants
    if (rewards !== undefined) updateData.rewards = rewards
    if (restrictions !== undefined) updateData.restrictions = restrictions
    
    // 更新活动信息
    const updatedActivity = await prisma.forumActivity.update({
      where: { id },
      data: updateData
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_POST',
        module: 'CONTENT',
        description: `更新活动 "${activity.title}" 的信息`,
        targetId: id,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      }
    })
    
    logger.info('Activity updated', { activityId: id, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: { activity: updatedActivity }
    })
    
  } catch (error) {
    logger.error('Update activity error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新活动状态
 */
export const updateActivityStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, reason } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查活动是否存在
    const activity = await prisma.forumActivity.findUnique({
      where: { id }
    })
    
    if (!activity) {
      res.status(404).json({
        success: false,
        error: 'Activity not found'
      })
      return
    }
    
    // 更新活动状态
    const updatedActivity = await prisma.forumActivity.update({
      where: { id },
      data: { status }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_POST_STATUS',
        module: 'CONTENT',
        description: `将活动 "${activity.title}" 状态更改为 ${status}${reason ? `，原因：${reason}` : ''}`,
        targetId: id,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      }
    })
    
    logger.info('Activity status updated', { activityId: id, status, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Activity status updated successfully',
      data: { activity: updatedActivity }
    })
    
  } catch (error) {
    logger.error('Update activity status error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 删除活动
 */
export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查活动是否存在
    const activity = await prisma.forumActivity.findUnique({
      where: { id }
    })
    
    if (!activity) {
      res.status(404).json({
        success: false,
        error: 'Activity not found'
      })
      return
    }
    
    // 检查权限（只有组织者和版主可以删除）
    if (activity.organizerId !== operator.id && operator.role !== 'MODERATOR') {
      res.status(403).json({
        success: false,
        error: 'Permission denied'
      })
      return
    }
    
    // 软删除活动（更新状态为CANCELLED）
    await prisma.forumActivity.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'DELETE_POST',
        module: 'CONTENT',
        description: `删除活动 "${activity.title}"`,
        targetId: id,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      }
    })
    
    logger.info('Activity deleted', { activityId: id, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    })
    
  } catch (error) {
    logger.error('Delete activity error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取活动参与者列表
 */
export const getActivityParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      page = 1,
      limit = 20,
      status
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = { activityId: id }
    
    if (status) {
      where.status = status
    }
    
    // 获取参与者列表
    const [participants, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          registeredAt: 'desc'
        }
      }),
      prisma.activityParticipant.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        participants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get activity participants error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取活动统计数据
 */
export const getActivityStats = async (req: Request, res: Response): Promise<void> => {
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
    const [totalActivities, activeActivities, completedActivities, cancelledActivities] = await Promise.all([
      prisma.forumActivity.count(),
      prisma.forumActivity.count({ where: { status: 'ACTIVE' } }),
      prisma.forumActivity.count({ where: { status: 'COMPLETED' } }),
      prisma.forumActivity.count({ where: { status: 'CANCELLED' } })
    ])
    
    // 按类型统计
    const typeStats = await prisma.forumActivity.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })
    
    // 按状态统计
    const statusStats = await prisma.forumActivity.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalActivities,
          activeActivities,
          completedActivities,
          cancelledActivities
        },
        typeStats,
        statusStats
      }
    })
    
  } catch (error) {
    logger.error('Get activity stats error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

// 默认导出
export default {
  getActivityList,
  getActivityById,
  createActivity,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
  getActivityParticipants,
  getActivityStats
};