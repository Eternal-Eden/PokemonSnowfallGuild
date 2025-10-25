import { Request, Response } from 'express'
import { getPrismaClient } from '../utils/database'
import { logger } from '../utils/logger'

/**
 * 获取操作日志列表
 */
export const getOperationLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      operator,
      action,
      module,
      startDate,
      endDate
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (operator) {
      where.operator = {
        username: { contains: operator as string, mode: 'insensitive' }
      }
    }
    
    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' }
    }
    
    if (module) {
      where.module = module
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
    
    // 获取操作日志列表
    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          operator: {
            select: {
              id: true,
              username: true,
              gameNickname: true,
              role: true
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
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get operation logs error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取操作日志详情
 */
export const getOperationLogDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const prisma = getPrismaClient()
    
    const log = await prisma.operationLog.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            username: true,
            gameNickname: true,
            role: true
          }
        }
      }
    })
    
    if (!log) {
      res.status(404).json({
        success: false,
        error: 'Operation log not found'
      })
      return
    }
    
    res.status(200).json({
      success: true,
      data: { log }
    })
    
  } catch (error) {
    logger.error('Get operation log detail error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取系统设置
 */
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const prisma = getPrismaClient()
    
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        category: 'asc'
      }
    })
    
    // 按分类组织设置
    const groupedSettings: Record<string, any> = {}
    settings.forEach(setting => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {}
      }
      groupedSettings[setting.category][setting.key] = {
        value: setting.value,
        description: setting.description,
        type: setting.type,
        updatedAt: setting.updatedAt
      }
    })
    
    res.status(200).json({
      success: true,
      data: { settings: groupedSettings }
    })
    
  } catch (error) {
    logger.error('Get system settings error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 批量更新设置
    const updatePromises: any[] = []
    const changes: string[] = []
    
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings as Record<string, any>)) {
        updatePromises.push(
          prisma.systemSetting.upsert({
            where: {
              category_key: {
                category,
                key
              }
            },
            update: {
              value: String(value),
              updatedAt: new Date()
            },
            create: {
              category,
              key,
              value: String(value),
              type: 'string'
            }
          })
        )
        changes.push(`${category}.${key} = ${value}`)
      }
    }
    
    await Promise.all(updatePromises)
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        module: 'SYSTEM',
        description: `更新系统设置：${changes.join(', ')}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('System settings updated', { operatorId: operator.id, changes })
    
    res.status(200).json({
      success: true,
      message: 'System settings updated successfully'
    })
    
  } catch (error) {
    logger.error('Update system settings error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取敏感词列表
 */
export const getSensitiveWords = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      keyword,
      status
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (keyword) {
      where.word = { contains: keyword as string, mode: 'insensitive' }
    }
    
    if (status) {
      where.isActive = status === 'active'
    }
    
    // 获取敏感词列表
    const [words, total] = await Promise.all([
      prisma.sensitiveWord.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sensitiveWord.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        words,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get sensitive words error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 添加敏感词
 */
export const addSensitiveWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      word,
      category,
      replacement,
      level = 1
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查敏感词是否已存在
    const existingWord = await prisma.sensitiveWord.findUnique({
      where: { word }
    })
    
    if (existingWord) {
      res.status(409).json({
        success: false,
        error: 'Sensitive word already exists'
      })
      return
    }
    
    // 添加敏感词
    const newWord = await prisma.sensitiveWord.create({
      data: {
        word,
        category,
        replacement,
        level,
        isActive: true
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'ADD_SENSITIVE_WORD',
        module: 'SYSTEM',
        description: `添加敏感词：${word}，分类：${category}`,
        targetId: newWord.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Sensitive word added', { wordId: newWord.id, word, operatorId: operator.id })
    
    res.status(201).json({
      success: true,
      message: 'Sensitive word added successfully',
      data: { word: newWord }
    })
    
  } catch (error) {
    logger.error('Add sensitive word error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新敏感词
 */
export const updateSensitiveWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      word,
      category,
      replacement,
      level,
      isActive
    } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查敏感词是否存在
    const existingWord = await prisma.sensitiveWord.findUnique({
      where: { id }
    })
    
    if (!existingWord) {
      res.status(404).json({
        success: false,
        error: 'Sensitive word not found'
      })
      return
    }
    
    // 更新敏感词
    const updatedWord = await prisma.sensitiveWord.update({
      where: { id },
      data: {
        word,
        category,
        replacement,
        level,
        isActive,
        updatedAt: new Date()
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'UPDATE_SENSITIVE_WORD',
        module: 'SYSTEM',
        description: `更新敏感词：${existingWord.word}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Sensitive word updated', { wordId: id, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Sensitive word updated successfully',
      data: { word: updatedWord }
    })
    
  } catch (error) {
    logger.error('Update sensitive word error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 删除敏感词
 */
export const deleteSensitiveWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查敏感词是否存在
    const existingWord = await prisma.sensitiveWord.findUnique({
      where: { id }
    })
    
    if (!existingWord) {
      res.status(404).json({
        success: false,
        error: 'Sensitive word not found'
      })
      return
    }
    
    // 删除敏感词
    await prisma.sensitiveWord.delete({
      where: { id }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'DELETE_SENSITIVE_WORD',
        module: 'SYSTEM',
        description: `删除敏感词：${existingWord.word}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Sensitive word deleted', { wordId: id, word: existingWord.word, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Sensitive word deleted successfully'
    })
    
  } catch (error) {
    logger.error('Delete sensitive word error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取举报列表
 */
export const getReportList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      category,
      startDate,
      endDate
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (category) {
      where.category = category
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
    
    // 获取举报列表
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              gameNickname: true
            }
          },
          handler: {
            select: {
              id: true,
              username: true,
              gameNickname: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.report.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get report list error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 处理举报
 */
export const handleReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, result, reason, action } = req.body
    const operator = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查举报是否存在
    const report = await prisma.report.findUnique({
      where: { id }
    })
    
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      })
      return
    }
    
    // 更新举报状态
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        result,
        reason,
        action,
        handlerId: operator.id,
        handledAt: new Date()
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: operator.id,
        action: 'HANDLE_REPORT',
        module: 'SYSTEM',
        description: `处理举报，结果：${result}${reason ? `，原因：${reason}` : ''}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Report handled', { reportId: id, status, result, operatorId: operator.id })
    
    res.status(200).json({
      success: true,
      message: 'Report handled successfully',
      data: { report: updatedReport }
    })
    
  } catch (error) {
    logger.error('Handle report error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取系统统计信息
 */
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const prisma = getPrismaClient()
    
    // 获取各种统计数据
    const [userCount, postCount, commentCount, reportCount, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } })
    ])
    
    // 获取今日新增数据
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [todayUsers, todayPosts, todayComments] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.post.count({ where: { createdAt: { gte: today } } }),
      prisma.comment.count({ where: { createdAt: { gte: today } } })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          userCount,
          postCount,
          commentCount,
          reportCount,
          pendingReports
        },
        today: {
          newUsers: todayUsers,
          newPosts: todayPosts,
          newComments: todayComments
        }
      }
    })
    
  } catch (error) {
    logger.error('Get system stats error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}