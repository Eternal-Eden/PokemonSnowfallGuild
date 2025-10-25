import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取今日帖子数
export async function GET(_request: NextRequest) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayPostsCount = await prisma.forumPost.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: 'ACTIVE' // 只统计已发布的帖子
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total: todayPostsCount,
        date: today.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get today posts count error:', error);

    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}