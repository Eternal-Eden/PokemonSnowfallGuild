import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 获取模板列表
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      pokemonId, 
      userId, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { pokemon: { nameChinese: { contains: search as string, mode: 'insensitive' } } },
        { pokemon: { nameEnglish: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    if (pokemonId) {
      where.pokemonId = Number(pokemonId);
    }

    if (userId) {
      where.userId = userId as string;
    }

    // 获取模板列表
    const templates = await prisma.template.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        pokemon: {
          select: {
            id: true,
            nameChinese: true,
            nameEnglish: true,
            nameJapanese: true,
            types: true,
            baseStats: true
          }
        },
        moves: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            favorites: true
          }
        }
      }
    });

    // 获取总数
    const total = await prisma.template.count({ where });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败'
    });
  }
};

// 获取单个模板详情
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        pokemon: {
          select: {
            id: true,
            nameChinese: true,
            nameEnglish: true,
            nameJapanese: true,
            types: true,
            baseStats: true
          }
        },
        moves: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            favorites: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 增加浏览次数
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板详情失败'
    });
  }
};

// 创建模板
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    const { pokemonId, name, level, nature, item, moves } = req.body;

    // 验证必填字段
    if (!pokemonId || !name || !level || !nature || !moves || moves.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // 验证宝可梦是否存在
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: Number(pokemonId) }
    });

    if (!pokemon) {
      return res.status(400).json({
        success: false,
        message: '宝可梦不存在'
      });
    }

    // 生成数据哈希用于去重
    const dataForHash = {
      pokemonId: Number(pokemonId),
      level: Number(level),
      nature,
      item: item || null,
      moves: moves.sort((a: any, b: any) => a.position - b.position)
    };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(dataForHash)).digest('hex');

    // 检查是否已存在相同配置的模板
    const existingTemplate = await prisma.template.findUnique({
      where: {
        userId_dataHash: {
          userId,
          dataHash
        }
      }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: '已存在相同配置的模板'
      });
    }

    // 智能命名：如果名称已存在，自动添加数字后缀
    let finalName = name;
    let counter = 1;
    while (true) {
      const existingName = await prisma.template.findFirst({
        where: {
          userId,
          name: finalName
        }
      });
      
      if (!existingName) break;
      
      counter++;
      finalName = `${name}${counter}`;
    }

    // 创建模板
    const template = await prisma.template.create({
      data: {
        userId,
        pokemonId: Number(pokemonId),
        name: finalName,
        level: Number(level),
        nature,
        item: item || null,
        dataHash,
        moves: {
          create: moves.map((move: any, index: number) => ({
            moveId: move.moveId,
            moveName: move.moveName,
            moveCategory: move.moveCategory,
            position: index + 1
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        pokemon: {
          select: {
            id: true,
            nameChinese: true,
            nameEnglish: true,
            nameJapanese: true,
            types: true,
            baseStats: true
          }
        },
        moves: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: template,
      message: '模板创建成功'
    });
  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模板失败'
    });
  }
};

// 更新模板
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, level, nature, item, moves } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    // 检查模板是否存在且属于当前用户
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    if (existingTemplate.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此模板'
      });
    }

    // 生成新的数据哈希
    const dataForHash = {
      pokemonId: existingTemplate.pokemonId,
      level: Number(level),
      nature,
      item: item || null,
      moves: moves.sort((a: any, b: any) => a.position - b.position)
    };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(dataForHash)).digest('hex');

    // 检查是否与其他模板重复
    const duplicateTemplate = await prisma.template.findFirst({
      where: {
        userId,
        dataHash,
        id: { not: id }
      }
    });

    if (duplicateTemplate) {
      return res.status(400).json({
        success: false,
        message: '已存在相同配置的模板'
      });
    }

    // 更新模板
    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        level: Number(level),
        nature,
        item: item || null,
        dataHash,
        moves: {
          deleteMany: {},
          create: moves.map((move: any, index: number) => ({
            moveId: move.moveId,
            moveName: move.moveName,
            moveCategory: move.moveCategory,
            position: index + 1
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        pokemon: {
          select: {
            id: true,
            nameChinese: true,
            nameEnglish: true,
            nameJapanese: true,
            types: true,
            baseStats: true
          }
        },
        moves: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: template,
      message: '模板更新成功'
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失败'
    });
  }
};

// 删除模板
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    // 检查模板是否存在且属于当前用户
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    if (template.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此模板'
      });
    }

    // 删除模板（级联删除相关数据）
    await prisma.template.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模板失败'
    });
  }
};

// 收藏/取消收藏模板
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    // 检查模板是否存在
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_templateId: {
          userId,
          templateId: id
        }
      }
    });

    if (existingFavorite) {
      // 取消收藏
      await prisma.favorite.delete({
        where: {
          userId_templateId: {
            userId,
            templateId: id
          }
        }
      });

      res.json({
        success: true,
        data: { isFavorited: false },
        message: '取消收藏成功'
      });
    } else {
      // 添加收藏
      await prisma.favorite.create({
        data: {
          userId,
          templateId: id
        }
      });

      res.json({
        success: true,
        data: { isFavorited: true },
        message: '收藏成功'
      });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({
      success: false,
      message: '收藏操作失败'
    });
  }
};

// 获取用户收藏的模板
export const getFavoriteTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            },
            pokemon: {
              select: {
                id: true,
                nameChinese: true,
                nameEnglish: true,
                nameJapanese: true,
                types: true,
                baseStats: true
              }
            },
            moves: {
              orderBy: { position: 'asc' }
            },
            _count: {
              select: {
                favorites: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.favorite.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        templates: favorites.map(f => f.template),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取收藏模板失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏模板失败'
    });
  }
};