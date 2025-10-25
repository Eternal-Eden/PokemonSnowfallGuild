import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * 获取模板列表
 * GET /api/templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const templateType = searchParams.get('templateType') || '';
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // 验证用户身份（用于收藏功能）
    const user = await verifyToken(request);
    
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { pokemon: { nameChinese: { contains: search, mode: 'insensitive' } } },
        { pokemon: { nameEnglish: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (templateType) {
      where.templateType = templateType;
    }

    if (favoritesOnly && user) {
      where.favorites = {
        some: {
          userId: user.id
        }
      };
    }

    // 获取模板列表
    const templates = await prisma.template.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
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

    // 转换为前端期望的扁平化格式
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      level: template.level,
      nature: template.nature,
      ability: template.ability,
      item: template.item,
      pokemonId: template.pokemonId,
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      user: {
        id: template.user.id,
        username: template.user.username,
        avatarUrl: template.user.avatarUrl
      },
      pokemon: {
        id: template.pokemon.id,
        nameChinese: template.pokemon.nameChinese,
        types: Array.isArray(template.pokemon.types) ? template.pokemon.types : []
      },
      moves: template.moves.map(move => ({
        id: move.id,
        moveId: move.moveId,
        moveName: move.moveName,
        moveCategory: move.moveCategory,
        position: move.position
      })),
      ivs: template.ivs,
      evs: template.evs,
      _count: {
        favorites: template._count.favorites
      }
    }));

    return NextResponse.json({
      data: formattedTemplates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取模板列表时出错:', error);
    return NextResponse.json(
      { error: '获取模板列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建模板
 * POST /api/templates
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户未登录' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const {
      pokemonId,
      name,
      level,
      nature,
      ability,
      item,
      moves,
      evs,
      ivs,
      abilityType,
      abilityName,
      templateType,
      abilityData
    } = body;

    // 验证必需字段
    if (!pokemonId || !name || !level || !nature || !moves || moves.length === 0) {
      return NextResponse.json(
        { success: false, message: '缺少必需字段' },
        { status: 400 }
      );
    }

    // 验证宝可梦是否存在
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: Number(pokemonId) }
    });

    if (!pokemon) {
      return NextResponse.json(
        { success: false, message: '宝可梦不存在' },
        { status: 400 }
      );
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
          userId: user.id,
          dataHash
        }
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: '已存在相同配置的模板' },
        { status: 400 }
      );
    }

    // 智能命名：如果名称已存在，自动添加数字后缀
    let finalName = name;
    let counter = 1;
    while (true) {
      const existingName = await prisma.template.findFirst({
        where: {
          userId: user.id,
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
        userId: user.id,
        pokemonId: Number(pokemonId),
        name: finalName,
        level: Number(level),
        nature,
        ability: typeof ability === 'string' ? ability : ability?.name || null,
        item: item || null,
        abilityType: abilityType || null,
        abilityName: abilityName || null,
        templateType: templateType || null,
        abilityData: abilityData || null,
        ivs: ivs || null,
        evs: evs || null,
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

    return NextResponse.json({
      success: true,
      data: template,
      message: '模板创建成功'
    });

  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '创建模板失败' 
      },
      { status: 500 }
    );
  }
}