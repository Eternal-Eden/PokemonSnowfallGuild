// 客户端版本的宝可梦工具函数

// 宝可梦数据接口
interface PokemonIndexEntry {
  english: string;
  japanese: string;
  chinese: string;
  french: string;
  imageFile: string;
}

// 属性映射接口
interface TypeMapping {
  english: string;
  chinese: string;
  japanese: string;
}

// 缓存数据
let pokemonIndex: PokemonIndexEntry[] | null = null;
let typeMapping: { [key: string]: TypeMapping } | null = null;

/**
 * 加载宝可梦索引数据（客户端版本）
 */
export async function loadPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (pokemonIndex) {
    return pokemonIndex;
  }

  try {
    const response = await fetch('/index.txt');
    const indexContent = await response.text();
    const lines = indexContent.trim().split('\n');
    
    pokemonIndex = lines.map(line => {
      // 解析格式：{'english': 'Bulbasaur', 'japanese': 'フシギダネ', 'chinese': '妙蛙种子', 'french': 'Bulbizarre'}：1.png
      const match = line.match(/\{'english':\s*'([^']+)',\s*'japanese':\s*'([^']+)',\s*'chinese':\s*'([^']+)',\s*'french':\s*'([^']+)'\}：(.+)/);
      if (match) {
        return {
          english: match[1],
          japanese: match[2],
          chinese: match[3],
          french: match[4],
          imageFile: match[5]
        };
      }
      return null;
    }).filter(Boolean) as PokemonIndexEntry[];
    
    return pokemonIndex;
  } catch (error) {
    console.error('Failed to load pokemon index:', error);
    return [];
  }
}

/**
 * 加载属性映射数据（客户端版本）
 */
export async function loadTypeMapping(): Promise<{ [key: string]: TypeMapping }> {
  if (typeMapping) {
    return typeMapping;
  }

  try {
    const response = await fetch('/types.yaml');
    const typesContent = await response.text();
    
    // 简单的YAML解析，只处理types数组
    const lines = typesContent.split('\n');
    const types: TypeMapping[] = [];
    
    let currentType: Partial<TypeMapping> = {};
    let inTypesSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'types:') {
        inTypesSection = true;
        continue;
      }
      
      if (!inTypesSection) continue;
      
      if (trimmedLine.startsWith('- english:')) {
        if (currentType.english && currentType.chinese && currentType.japanese) {
          types.push(currentType as TypeMapping);
        }
        currentType = { english: trimmedLine.replace('- english:', '').trim().replace(/["']/g, '') };
      } else if (trimmedLine.startsWith('chinese:')) {
        currentType.chinese = trimmedLine.replace('chinese:', '').trim().replace(/["']/g, '');
      } else if (trimmedLine.startsWith('japanese:')) {
        currentType.japanese = trimmedLine.replace('japanese:', '').trim().replace(/["']/g, '');
      }
    }
    
    // 添加最后一个类型
    if (currentType.english && currentType.chinese && currentType.japanese) {
      types.push(currentType as TypeMapping);
    }
    
    typeMapping = {};
    types.forEach(type => {
      typeMapping![type.english.toLowerCase()] = type;
    });
    
    return typeMapping;
  } catch (error) {
    console.error('Failed to load type mapping:', error);
    return {};
  }
}

/**
 * 根据宝可梦名称获取图片文件名
 */
export async function getPokemonImageFile(pokemonName: string): Promise<string | null> {
  const index = await loadPokemonIndex();
  const entry = index.find(pokemon => 
    pokemon.chinese === pokemonName || 
    pokemon.english.toLowerCase() === pokemonName.toLowerCase() ||
    pokemon.japanese === pokemonName
  );
  
  return entry ? entry.imageFile : null;
}

/**
 * 根据宝可梦名称获取图片URL
 */
export async function getPokemonImageUrl(pokemonName: string): Promise<string> {
  const imageFile = await getPokemonImageFile(pokemonName);
  if (imageFile) {
    // 将1.png格式转换为001.png格式
    const match = imageFile.match(/(\d+)\.png/);
    if (match) {
      const number = match[1].padStart(3, '0');
      return `/thumbnails/${number}.png`;
    }
    return `/thumbnails/${imageFile}`;
  }
  // 返回默认图片
  return '/thumbnails/default.png';
}

/**
 * 获取所有中文属性名称
 */
export async function getChineseTypes(): Promise<string[]> {
  const types = await loadTypeMapping();
  return Object.values(types).map(type => type.chinese);
}

/**
 * 将英文属性名转换为中文
 */
export async function getChineseTypeName(englishType: string): Promise<string> {
  const types = await loadTypeMapping();
  const type = types[englishType.toLowerCase()];
  return type ? type.chinese : englishType;
}

/**
 * 将中文属性名转换为英文
 */
export async function getEnglishTypeName(chineseType: string): Promise<string> {
  const types = await loadTypeMapping();
  const entry = Object.values(types).find(type => type.chinese === chineseType);
  return entry ? entry.english : chineseType;
}

/**
 * 获取属性对应的颜色类名
 */
export function getTypeColor(chineseType: string): string {
  const typeColors: { [key: string]: string } = {
    '普通': 'bg-gray-400',
    '火': 'bg-red-500',
    '水': 'bg-blue-500',
    '电': 'bg-yellow-400',
    '草': 'bg-green-500',
    '冰': 'bg-blue-300',
    '格斗': 'bg-red-700',
    '毒': 'bg-purple-500',
    '地面': 'bg-yellow-600',
    '飞行': 'bg-indigo-400',
    '超能力': 'bg-pink-500',
    '虫': 'bg-green-400',
    '岩石': 'bg-yellow-800',
    '幽灵': 'bg-purple-700',
    '龙': 'bg-indigo-700',
    '恶': 'bg-gray-800',
    '钢': 'bg-gray-500',
    '妖精': 'bg-pink-300'
  };
  return typeColors[chineseType] || 'bg-gray-400';
}

/**
 * 同步版本的获取中文属性名称（使用硬编码作为fallback）
 */
export function getChineseTypesSync(): string[] {
  return [
    '普通', '火', '水', '电', '草', '冰', '格斗', '毒', '地面', '飞行',
    '超能力', '虫', '岩石', '幽灵', '龙', '恶', '钢', '妖精'
  ];
}