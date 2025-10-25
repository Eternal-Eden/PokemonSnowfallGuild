import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个宝可梦详情
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // 验证ID是否为数字
    const pokemonId = parseInt(id);
    if (isNaN(pokemonId)) {
      return NextResponse.json({
        success: false,
        message: '无效的宝可梦ID'
      }, { status: 400 });
    }

    const pokemon = await prisma.pokemon.findUnique({
      where: { id: pokemonId },
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
      return NextResponse.json({
        success: false,
        message: '宝可梦不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: pokemon
    });
  } catch (error) {
    console.error('获取宝可梦详情失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取宝可梦详情失败'
    }, { status: 500 });
  }
}