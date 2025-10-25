import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'offensive' or 'defensive'

    if (!type || (type !== 'offensive' && type !== 'defensive')) {
      return NextResponse.json(
        { error: '请指定有效的特性类型 (offensive 或 defensive)' },
        { status: 400 }
      );
    }

    const fileName = type === 'offensive' ? '进攻特性.yaml' : '防守特性.yaml';
    const filePath = path.join(process.cwd(), 'public', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `特性文件不存在: ${fileName}` },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const yamlData = yaml.load(fileContent) as any;

    // 转换数据格式为前端友好的格式
    const abilityKey = type === 'offensive' ? '进攻特性' : '防守特性';
    const abilities = yamlData[abilityKey];

    const formattedAbilities = Object.entries(abilities).map(([name, data]: [string, any]) => ({
      name,
      effect: data.效果,
      trigger: data.触发条件,
      note: data.备注,
      type: type === 'offensive' ? 'offensive' : 'defensive'
    }));

    return NextResponse.json({
      type,
      abilities: formattedAbilities,
      count: formattedAbilities.length
    });

  } catch (error) {
    console.error('获取特性数据失败:', error);
    return NextResponse.json(
      { error: '获取特性数据失败' },
      { status: 500 }
    );
  }
}