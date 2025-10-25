import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * 获取单个模板
 * GET /api/templates/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户身份（可选，用于收藏功能）
    const user = await verifyToken(request);

    // 从数据库获取模板详情
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
      return NextResponse.json(
        { 
          success: false, 
          message: '模板不存在' 
        },
        { status: 404 }
      );
    }

    // 增加浏览次数
    await prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    // 转换为前端期望的扁平化格式
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      level: template.level,
      nature: template.nature,
      ability: template.ability,
      item: template.item,
      pokemonId: template.pokemonId,
      usageCount: (template.usageCount || 0) + 1, // 包含刚刚增加的浏览次数
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      traceId: template.traceId,
      user: {
        id: template.user.id,
        username: template.user.username,
        avatarUrl: template.user.avatarUrl
      },
      pokemon: {
        id: template.pokemon.id,
        nameChinese: template.pokemon.nameChinese,
        nameEnglish: template.pokemon.nameEnglish,
        nameJapanese: template.pokemon.nameJapanese,
        types: Array.isArray(template.pokemon.types) ? template.pokemon.types : [],
        baseStats: template.pokemon.baseStats
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
    };

    return NextResponse.json({
      success: true,
      data: formattedTemplate
    });

  } catch (error) {
    console.error('获取模板详情失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取模板详情失败' 
      },
      { status: 500 }
    );
  }
}

/**
 * 删除模板
 * DELETE /api/templates/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户身份
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户未登录' },
        { status: 401 }
      );
    }

    // 检查模板是否存在且属于当前用户
    const template = await prisma.template.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      );
    }

    if (template.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: '无权限删除此模板' },
        { status: 403 }
      );
    }

    // 删除模板（级联删除相关的moves和favorites）
    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '模板删除成功'
    });

  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '删除模板失败' 
      },
      { status: 500 }
    );
  }
}