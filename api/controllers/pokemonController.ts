import { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取宝可梦列表
export const getPokemon = async (req: any, res: any) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      type,
      sortBy = 'id',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nameChinese: { contains: search as string, mode: 'insensitive' } },
        { nameEnglish: { contains: search as string, mode: 'insensitive' } },
        { nameJapanese: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.types = {
        array_contains: [type]
      };
    }

    // 获取宝可梦列表
    const pokemon = await prisma.pokemon.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      }
    });

    // 获取总数
    const total = await prisma.pokemon.count({ where });

    res.json({
      success: true,
      data: {
        pokemon,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取宝可梦列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取宝可梦列表失败'
    });
  }
};

// 根据ID获取宝可梦详情
export const getPokemonById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const pokemon = await prisma.pokemon.findUnique({
      where: { id: Number(id) },
      include: {
        templates: {
          take: 10,
          orderBy: { usageCount: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
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

    if (!pokemon) {
      return res.status(404).json({
        success: false,
        message: '宝可梦不存在'
      });
    }

    res.json({
      success: true,
      data: pokemon
    });
  } catch (error) {
    console.error('获取宝可梦详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取宝可梦详情失败'
    });
  }
};

// 搜索宝可梦（用于模板创建时的选择器）
// 搜索宝可梦
export const searchPokemon = async (req: any, res: any) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const pokemon = await prisma.pokemon.findMany({
      where: {
        OR: [
          { nameChinese: { contains: q as string, mode: 'insensitive' } },
          { nameEnglish: { contains: q as string, mode: 'insensitive' } },
          { nameJapanese: { contains: q as string, mode: 'insensitive' } }
        ]
      },
      take: Number(limit),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nameChinese: true,
        nameEnglish: true,
        nameJapanese: true,
        types: true,
        baseStats: true
      }
    });

    res.json({
      success: true,
      data: pokemon
    });
  } catch (error) {
    console.error('搜索宝可梦失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索宝可梦失败'
    });
  }
};

// 获取宝可梦类型统计
export const getPokemonTypeStats = async (req: any, res: any) => {
  try {
    // 从静态数据缓存获取类型数据
    const typesCache = await prisma.staticDataCache.findUnique({
      where: { dataType: 'types' }
    });

    if (!typesCache) {
      return res.status(404).json({
        success: false,
        message: '类型数据不存在'
      });
    }

    const types = typesCache.dataContent as any[];
    
    // 统计每个类型的宝可梦数量
    const typeStats = await Promise.all(
      types.map(async (type) => {
        const count = await prisma.pokemon.count({
          where: {
            types: {
              array_contains: [type.english]
            }
          }
        });

        return {
          type: type.english,
          typeChinese: type.chinese,
          typeJapanese: type.japanese,
          count
        };
      })
    );

    res.json({
      success: true,
      data: typeStats.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    console.error('获取类型统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取类型统计失败'
    });
  }
};