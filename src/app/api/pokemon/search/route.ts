import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 搜索参数验证schema
const searchQuerySchema = z.object({
  q: z.string().min(1, '搜索关键词不能为空'),
  limit: z.string().optional().transform((val: string | undefined) => {
    if (!val) return 20;
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100);
  }),
});

// 搜索宝可梦（用于模板创建时的选择器）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams);
    
    // 验证查询参数
    const validationResult = searchQuerySchema.safeParse(rawParams);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '参数验证失败',
        errors: validationResult.error.issues
      }, { status: 400 });
    }

    const { q, limit } = validationResult.data;

    const pokemon = await prisma.pokemon.findMany({
      where: {
        OR: [
          { nameChinese: { contains: q, mode: 'insensitive' } },
          { nameEnglish: { contains: q, mode: 'insensitive' } },
          { nameJapanese: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limit,
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

    return NextResponse.json({
      success: true,
      data: pokemon
    });
  } catch (error) {
    console.error('搜索宝可梦失败:', error);
    return NextResponse.json({
      success: false,
      message: '搜索宝可梦失败'
    }, { status: 500 });
  }
}