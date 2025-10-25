import { NextRequest, NextResponse } from 'next/server';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 获取自定义道具数据
 * GET /api/static-data/items/custom
 */
export async function GET(_request: NextRequest) {
  try {
    const itemsCustomPath = path.join(process.cwd(), 'public', 'items_custom.yaml');
    
    if (!fs.existsSync(itemsCustomPath)) {
      return NextResponse.json(
        {
          success: false,
          message: '自定义道具文件不存在'
        },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(itemsCustomPath, 'utf8');
    const itemsData = yaml.load(fileContent) as any;

    if (!itemsData) {
      return NextResponse.json(
        {
          success: false,
          message: '解析自定义道具文件失败'
        },
        { status: 500 }
      );
    }

    // 提取所有道具名称
    const items: Array<{id: string, name: string, category: string}> = [];
    
    // 处理攻击道具
    if (itemsData.attacker_items) {
      Object.keys(itemsData.attacker_items).forEach((itemName, index) => {
        items.push({
          id: `attacker_${index}`,
          name: itemName,
          category: 'attacker'
        });
      });
    }

    // 处理防御道具
    if (itemsData.defender_items) {
      Object.keys(itemsData.defender_items).forEach((itemName, index) => {
        items.push({
          id: `defender_${index}`,
          name: itemName,
          category: 'defender'
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('获取自定义道具失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取自定义道具失败'
      },
      { status: 500 }
    );
  }
}