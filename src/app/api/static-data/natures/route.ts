import { NextRequest, NextResponse } from 'next/server';
import { natureModifiers } from '@/utils/pokemonStatsCalculator';

/**
 * 获取宝可梦性格数据
 * GET /api/static-data/natures
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';

    // 从性格修正表获取数据
    let natures = Object.values(natureModifiers);

    // 搜索过滤
    if (search) {
      natures = natures.filter(nature => 
        nature.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 分页
    const total = natures.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNatures = natures.slice(startIndex, endIndex);

    // 格式化数据，添加额外信息
    const formattedNatures = paginatedNatures.map((nature, index) => ({
      id: startIndex + index + 1,
      name: nature.name,
      stats: {
        HP: nature.HP,
        Attack: nature.Attack,
        Defense: nature.Defense,
        Sp_Attack: nature.Sp_Attack,
        Sp_Defense: nature.Sp_Defense,
        Speed: nature.Speed
      },
      // 计算增强和减弱的属性
      increased: Object.entries(nature).find(([key, value]) => 
        key !== 'name' && value > 1.0
      )?.[0] || null,
      decreased: Object.entries(nature).find(([key, value]) => 
        key !== 'name' && value < 1.0
      )?.[0] || null,
      // 判断是否为中性性格
      isNeutral: Object.values(nature).filter((value, idx) => 
        idx > 0 && value !== 1.0
      ).length === 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedNatures,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取性格数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取性格数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}