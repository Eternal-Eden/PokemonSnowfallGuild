import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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
 * 加载宝可梦索引数据
 */
export function loadPokemonIndex(): PokemonIndexEntry[] {
  if (pokemonIndex) {
    return pokemonIndex;
  }

  try {
    const indexPath = path.join(process.cwd(), 'public', 'index.txt');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const lines = indexContent.trim().split('\n');
    
    pokemonIndex = lines.map(line => {
      const parts = line.split('\t');
      if (parts.length >= 5) {
        return {
          english: parts[0],
          japanese: parts[1],
          chinese: parts[2],
          french: parts[3],
          imageFile: parts[4]
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
 * 加载属性映射数据
 */
export function loadTypeMapping(): { [key: string]: TypeMapping } {
  if (typeMapping) {
    return typeMapping;
  }

  try {
    const typesPath = path.join(process.cwd(), 'public', 'types.yaml');
    const typesContent = fs.readFileSync(typesPath, 'utf-8');
    const typesData = yaml.load(typesContent) as { types: TypeMapping[] };
    
    typeMapping = {};
    typesData.types.forEach(type => {
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
export function getPokemonImageFile(pokemonName: string): string | null {
  const index = loadPokemonIndex();
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
export function getPokemonImageUrl(pokemonName: string): string {
  const imageFile = getPokemonImageFile(pokemonName);
  if (imageFile) {
    return `/thumbnails/${imageFile}`;
  }
  // 返回默认图片
  return '/thumbnails/default.png';
}

/**
 * 获取所有中文属性名称
 */
export function getChineseTypes(): string[] {
  const types = loadTypeMapping();
  return Object.values(types).map(type => type.chinese);
}

/**
 * 将英文属性名转换为中文
 */
export function getChineseTypeName(englishType: string): string {
  const types = loadTypeMapping();
  const type = types[englishType.toLowerCase()];
  return type ? type.chinese : englishType;
}

/**
 * 将中文属性名转换为英文
 */
export function getEnglishTypeName(chineseType: string): string {
  const types = loadTypeMapping();
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