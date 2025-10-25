import * as yaml from 'js-yaml';

// 类型映射接口
interface TypeMapping {
  english: string;
  chinese: string;
  japanese: string;
}

// 宝可梦数据接口（从pokedex.yaml）
interface PokemonData {
  id: number;
  name: {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
  };
  type: string[];
  base: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
}

// 缓存类型映射数据
let typeMappingCache: TypeMapping[] | null = null;
let pokedexCache: PokemonData[] | null = null;

/**
 * 加载类型映射数据
 */
async function loadTypeMappings(): Promise<TypeMapping[]> {
  if (typeMappingCache) {
    return typeMappingCache;
  }

  try {
    const response = await fetch('/types.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch types.yaml: ${response.status}`);
    }
    const yamlText = await response.text();
    const typeMappings = yaml.load(yamlText) as TypeMapping[];
    
    typeMappingCache = typeMappings;
    return typeMappings;
  } catch (error) {
    console.error('Error loading type mappings:', error);
    throw new Error('无法加载类型映射数据');
  }
}

/**
 * 加载宝可梦数据
 */
async function loadPokedexData(): Promise<PokemonData[]> {
  if (pokedexCache) {
    return pokedexCache;
  }

  try {
    const response = await fetch('/pokedex.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch pokedex.yaml: ${response.status}`);
    }
    const yamlText = await response.text();
    const pokedexData = yaml.load(yamlText) as PokemonData[];
    
    pokedexCache = pokedexData;
    return pokedexData;
  } catch (error) {
    console.error('Error loading pokedex data:', error);
    throw new Error('无法加载宝可梦数据');
  }
}

/**
 * 将英文类型转换为中文类型
 * @param englishTypes 英文类型数组
 * @returns 中文类型数组
 */
export async function convertTypesToChinese(englishTypes: string[]): Promise<string[]> {
  try {
    const typeMappings = await loadTypeMappings();
    
    const chineseTypes = englishTypes.map(englishType => {
      const mapping = typeMappings.find(type => type.english === englishType);
      if (!mapping) {
        console.warn(`未找到类型映射: ${englishType}`);
        return englishType; // 如果找不到映射，返回原英文类型
      }
      return mapping.chinese;
    });

    return chineseTypes;
  } catch (error) {
    console.error('Error converting types to Chinese:', error);
    throw error;
  }
}

/**
 * 根据宝可梦ID获取其类型信息
 * @param pokemonId 宝可梦ID
 * @returns 包含英文和中文类型的对象
 */
export async function getPokemonTypes(pokemonId: number): Promise<{
  englishTypes: string[];
  chineseTypes: string[];
}> {
  try {
    const pokedexData = await loadPokedexData();
    
    const pokemon = pokedexData.find(p => p.id === pokemonId);
    if (!pokemon) {
      throw new Error(`未找到ID为 ${pokemonId} 的宝可梦`);
    }

    const englishTypes = pokemon.type;
    const chineseTypes = await convertTypesToChinese(englishTypes);

    return {
      englishTypes,
      chineseTypes
    };
  } catch (error) {
    console.error('Error getting pokemon types:', error);
    throw error;
  }
}

/**
 * 根据宝可梦中文名称获取其类型信息
 * @param pokemonName 宝可梦中文名称
 * @returns 包含英文和中文类型的对象
 */
export async function getPokemonTypesByName(pokemonName: string): Promise<{
  englishTypes: string[];
  chineseTypes: string[];
}> {
  try {
    const pokedexData = await loadPokedexData();
    
    const pokemon = pokedexData.find(p => p.name.chinese === pokemonName);
    if (!pokemon) {
      throw new Error(`未找到名称为 ${pokemonName} 的宝可梦`);
    }

    const englishTypes = pokemon.type;
    const chineseTypes = await convertTypesToChinese(englishTypes);

    return {
      englishTypes,
      chineseTypes
    };
  } catch (error) {
    console.error('Error getting pokemon types by name:', error);
    throw error;
  }
}

/**
 * 获取类型对应的颜色样式
 * @param typeName 类型名称（中文或英文）
 * @returns CSS类名
 */
export function getTypeColor(typeName: string): string {
  // 类型颜色映射（支持中英文）
  const typeColors: Record<string, string> = {
    // 英文类型
    'Normal': 'bg-gray-400',
    'Fighting': 'bg-red-600',
    'Flying': 'bg-indigo-400',
    'Poison': 'bg-purple-500',
    'Ground': 'bg-yellow-600',
    'Rock': 'bg-yellow-800',
    'Bug': 'bg-green-400',
    'Ghost': 'bg-purple-700',
    'Steel': 'bg-gray-500',
    'Fire': 'bg-red-500',
    'Water': 'bg-blue-500',
    'Grass': 'bg-green-500',
    'Electric': 'bg-yellow-400',
    'Psychic': 'bg-pink-500',
    'Ice': 'bg-blue-300',
    'Dragon': 'bg-indigo-700',
    'Dark': 'bg-gray-800',
    'Fairy': 'bg-pink-300',
    
    // 中文类型
    '一般': 'bg-gray-400',
    '格斗': 'bg-red-600',
    '飞行': 'bg-indigo-400',
    '毒': 'bg-purple-500',
    '地上': 'bg-yellow-600',
    '岩石': 'bg-yellow-800',
    '虫': 'bg-green-400',
    '幽灵': 'bg-purple-700',
    '钢': 'bg-gray-500',
    '炎': 'bg-red-500',
    '水': 'bg-blue-500',
    '草': 'bg-green-500',
    '电': 'bg-yellow-400',
    '超能': 'bg-pink-500',
    '冰': 'bg-blue-300',
    '龙': 'bg-indigo-700',
    '恶': 'bg-gray-800',
    '妖精': 'bg-pink-300'
  };

  return typeColors[typeName] || 'bg-gray-400';
}

/**
 * 清除缓存（用于开发调试）
 */
export function clearCache(): void {
  typeMappingCache = null;
  pokedexCache = null;
}