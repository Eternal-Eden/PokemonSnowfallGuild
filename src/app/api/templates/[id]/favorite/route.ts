import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * 切换模板收藏状态
 * POST /api/templates/[id]/favorite
 */
export async function POST(
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

    // 检查模板是否存在
    const template = await prisma.template.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      );
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_templateId: {
          userId: user.id,
          templateId: id
        }
      }
    });

    let favoriteCount: number;

    if (existingFavorite) {
      // 取消收藏
      await prisma.favorite.delete({
        where: {
          userId_templateId: {
            userId: user.id,
            templateId: id
          }
        }
      });

      // 获取更新后的收藏数
      favoriteCount = await prisma.favorite.count({
        where: { templateId: id }
      });

      return NextResponse.json({
        success: true,
        data: {
          isFavorited: false,
          favoriteCount
        },
        message: '已取消收藏'
      });
    } else {
      // 添加收藏
      await prisma.favorite.create({
        data: {
          userId: user.id,
          templateId: id
        }
      });

      // 获取更新后的收藏数
      favoriteCount = await prisma.favorite.count({
        where: { templateId: id }
      });

      return NextResponse.json({
        success: true,
        data: {
          isFavorited: true,
          favoriteCount
        },
        message: '已添加收藏'
      });
    }

  } catch (error) {
    console.error('切换收藏状态失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '操作失败' 
      },
      { status: 500 }
    );
  }
}