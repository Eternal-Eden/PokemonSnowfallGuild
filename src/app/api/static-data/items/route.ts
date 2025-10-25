import { NextRequest, NextResponse } from 'next/server';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

interface ItemName {
  english?: string;
  japanese?: string;
  chinese?: string;
}

interface Item {
  id: number;
  name: ItemName | string;
}

/**
 * 获取宝可梦道具数据
 * GET /api/static-data/items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    // 读取YAML文件
    const yamlPath = path.join(process.cwd(), 'public', 'items.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(yamlContent) as Item[];

    if (!Array.isArray(data)) {
      throw new Error('道具数据格式错误');
    }

    // 格式化数据，优先显示中文名称
    let items = data.map(item => {
      let displayName = '';
      let englishName = '';
      let japaneseName = '';
      let chineseName = '';

      if (typeof item.name === 'string') {
        displayName = item.name;
      } else if (item.name && typeof item.name === 'object') {
        chineseName = item.name.chinese || '';
        englishName = item.name.english || '';
        japaneseName = item.name.japanese || '';
        
        // 优先显示中文名称，其次英文，最后日文
        displayName = chineseName || englishName || japaneseName || `道具 ${item.id}`;
      } else {
        displayName = `道具 ${item.id}`;
      }

      return {
        id: item.id,
        name: displayName,
        names: {
          chinese: chineseName,
          english: englishName,
          japanese: japaneseName
        }
      };
    }).filter(item => item.id > 0 && item.name); // 过滤掉无效数据

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.names.chinese.toLowerCase().includes(searchLower) ||
        item.names.english.toLowerCase().includes(searchLower) ||
        item.names.japanese.toLowerCase().includes(searchLower)
      );
    }

    // 分页
    const total = items.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedItems,
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
    console.error('获取道具数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取道具数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}