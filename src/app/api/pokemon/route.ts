import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 查询参数验证schema
const getPokemonQuerySchema = z.object({
  page: z.string().optional().transform((val: string | undefined) => {
    if (!val) return 1;
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform((val: string | undefined) => {
    if (!val) return 50;
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 50 : Math.min(parsed, 100);
  }),
  search: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// 获取宝可梦列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams);
    
    // 验证查询参数
    const validationResult = getPokemonQuerySchema.safeParse(rawParams);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '参数验证失败',
        errors: validationResult.error.issues
      }, { status: 400 });
    }

    const { page, limit, search, type, sortBy, sortOrder } = validationResult.data;
    
    const skip = (page - 1) * limit;
    const take = limit;

    // 构建查询条件
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { nameChinese: { contains: search, mode: 'insensitive' } },
        { nameEnglish: { contains: search, mode: 'insensitive' } },
        { nameJapanese: { contains: search, mode: 'insensitive' } }
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
        [sortBy]: sortOrder
      }
    });

    // 获取总数
    const total = await prisma.pokemon.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        pokemon,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取宝可梦列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取宝可梦列表失败'
    }, { status: 500 });
  }
}