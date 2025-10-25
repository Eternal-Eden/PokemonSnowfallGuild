import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取论坛分类列表
export async function GET(_request: NextRequest) {
  try {
    // 从数据库获取分类列表
    const categories = await prisma.forumCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        postCount: true,
        lastPostAt: true,
        orderIndex: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('获取论坛分类失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}