import { NextRequest, NextResponse } from 'next/server';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

interface Move {
  id: number;
  accuracy: number | null;
  category: string;
  cname: string;
  ename: string;
  jname: string;
  power: number | null;
  pp: number;
  type: string;
  tm?: number;
}

/**
 * 获取宝可梦技能数据
 * GET /api/static-data/moves
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    // 读取YAML文件
    const yamlPath = path.join(process.cwd(), 'public', 'moves.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(yamlContent) as Move[];

    if (!Array.isArray(data)) {
      throw new Error('技能数据格式错误');
    }

    // 格式化数据
    let moves = data.map(move => ({
      id: move.id,
      name: move.cname || move.ename || `技能 ${move.id}`, // 优先显示中文名称
      names: {
        chinese: move.cname || '',
        english: move.ename || '',
        japanese: move.jname || ''
      },
      type: move.type || 'Normal',
      category: move.category || '变化',
      power: move.power ?? 0, // 确保power不为null，如果为null则设为0
      accuracy: move.accuracy ?? 0, // 确保accuracy不为null，如果为null则设为0
      pp: move.pp ?? 0, // 确保pp不为null，如果为null则设为0
      tm: move.tm || null,
      // 添加技能描述信息
      description: `${move.category || '变化'}技能${move.power ? `，威力${move.power}` : ''}${move.accuracy ? `，命中率${move.accuracy}%` : ''}，PP${move.pp || 0}`
    })).filter(move => move.id > 0 && move.name); // 过滤掉无效数据

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      moves = moves.filter(move => 
        move.name.toLowerCase().includes(searchLower) ||
        move.names.chinese.toLowerCase().includes(searchLower) ||
        move.names.english.toLowerCase().includes(searchLower) ||
        move.names.japanese.toLowerCase().includes(searchLower) ||
        move.type.toLowerCase().includes(searchLower)
      );
    }

    // 属性过滤
    if (type) {
      moves = moves.filter(move => 
        move.type.toLowerCase() === type.toLowerCase()
      );
    }

    // 分类过滤
    if (category) {
      moves = moves.filter(move => 
        move.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 分页
    const total = moves.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMoves = moves.slice(startIndex, endIndex);

    // 获取可用的属性和分类列表
    const availableTypes = [...new Set(data.map(move => move.type).filter(Boolean))];
    const availableCategories = [...new Set(data.map(move => move.category).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: paginatedMoves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      },
      filters: {
        types: availableTypes,
        categories: availableCategories
      }
    });
  } catch (error) {
    console.error('获取技能数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取技能数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}