import { Request, Response } from 'express'
import { getPrismaClient } from '../utils/database'
import { logger } from '../utils/logger'

/**
 * 获取帖子列表
 */
export const getPostList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      keyword,
      circleId,
      authorId,
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
    
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { content: { contains: keyword as string, mode: 'insensitive' } }
      ]
    }
    

    
    if (authorId) {
      where.authorId = authorId
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
    
    // 获取帖子列表
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              gameNickname: true,
              profile: {
                select: {
                  avatar: true
                }
              }
            }
          },

          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.post.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get post list error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 获取帖子详情
 */
export const getPostDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const prisma = getPrismaClient()
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            gameNickname: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        },

        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                gameNickname: true,
                profile: {
                  select: {
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    })
    
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found'
      })
      return
    }
    
    res.status(200).json({
      success: true,
      data: { post }
    })
    
  } catch (error) {
    logger.error('Get post detail error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 更新帖子状态
 */
export const updatePostStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, reason } = req.body
    const user = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    })
    
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found'
      })
      return
    }
    
    // 更新帖子状态
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { status }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: user.id,
        action: 'UPDATE_POST_STATUS',
        module: 'CONTENT',
        description: `将帖子 "${post.title}" 状态更改为 ${status}${reason ? `，原因：${reason}` : ''}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Post status updated', { postId: id, status, operatorId: user.id })
    
    res.status(200).json({
      success: true,
      message: 'Post status updated successfully',
      data: { post: updatedPost }
    })
    
  } catch (error) {
    logger.error('Update post status error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 批量更新帖子状态
 */
export const batchUpdatePostStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, status, reason } = req.body
    const user = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 批量更新帖子状态
    const result = await prisma.post.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: { status }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: user.id,
        action: 'BATCH_UPDATE_POST_STATUS',
        module: 'CONTENT',
        description: `批量将 ${result.count} 个帖子状态更改为 ${status}${reason ? `，原因：${reason}` : ''}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Batch post status updated', { count: result.count, status, operatorId: user.id })
    
    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.count} posts`,
      data: { count: result.count }
    })
    
  } catch (error) {
    logger.error('Batch update post status error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 置顶帖子
 */
export const togglePostTop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { isTop, topLevel = 1 } = req.body
    const user = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id }
    })
    
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found'
      })
      return
    }
    
    // 更新帖子状态（使用status字段代替isTop）
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        status: isTop ? 'ACTIVE' : 'ACTIVE', // Post模型中没有置顶状态，保持ACTIVE
        updatedAt: new Date()
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: user.id,
        action: isTop ? 'PIN_POST' : 'UNPIN_POST',
        module: 'CONTENT',
        description: `${isTop ? '置顶' : '取消置顶'}帖子 "${post.title}"${isTop ? `，置顶级别：${topLevel}` : ''}`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Post top status updated', { postId: id, isTop, topLevel, operatorId: user.id })
    
    res.status(200).json({
      success: true,
      message: `Post ${isTop ? 'pinned' : 'unpinned'} successfully`,
      data: { post: updatedPost }
    })
    
  } catch (error) {
    logger.error('Toggle post top error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * 删除帖子
 */
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const user = (req as any).user
    
    const prisma = getPrismaClient()
    
    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id }
    })
    
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found'
      })
      return
    }
    
    // 删除帖子（软删除，使用status字段）
    await prisma.post.update({
      where: { id },
      data: {
        status: 'DELETED' as any, // 标记为已删除
        updatedAt: new Date()
      }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        operatorId: user.id,
        action: 'DELETE_POST',
        module: 'CONTENT',
        description: `删除帖子 "${post.title}"`,
        targetId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    })
    
    logger.info('Post deleted', { postId: id, operatorId: user.id })
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    })
    
  } catch (error) {
    logger.error('Delete post error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}



/**
 * 获取评论列表
 */
export const getCommentList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      postId,
      status,
      keyword
    } = req.query
    
    const prisma = getPrismaClient()
    const skip = (Number(page) - 1) * Number(limit)
    
    // 构建查询条件
    const where: any = {}
    
    if (postId) {
      where.postId = postId
    }
    
    if (status) {
      where.status = status
    }
    
    if (keyword) {
      where.content = { contains: keyword as string, mode: 'insensitive' }
    }
    
    // 获取评论列表
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              gameNickname: true,
              profile: {
                select: {
                  avatar: true
                }
              }
            }
          },
          post: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.comment.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
    
  } catch (error) {
    logger.error('Get comment list error', { error: error instanceof Error ? error.message : error })
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}