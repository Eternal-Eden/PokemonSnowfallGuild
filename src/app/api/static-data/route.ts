import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取静态数据类型列表
 * GET /api/static-data
 */
export async function GET(_request: NextRequest) {
  try {
    const staticDataTypes = [
      {
        type: 'natures',
        name: '性格',
        description: '宝可梦性格数据，包含属性修正值',
        endpoint: '/api/static-data/natures'
      },
      {
        type: 'items',
        name: '道具',
        description: '宝可梦道具数据',
        endpoint: '/api/static-data/items'
      },
      {
        type: 'moves',
        name: '技能',
        description: '宝可梦技能数据，包含威力、PP、属性等信息',
        endpoint: '/api/static-data/moves'
      }
    ];

    return NextResponse.json({
      success: true,
      data: staticDataTypes,
      total: staticDataTypes.length
    });
  } catch (error) {
    console.error('获取静态数据类型失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取静态数据类型失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}