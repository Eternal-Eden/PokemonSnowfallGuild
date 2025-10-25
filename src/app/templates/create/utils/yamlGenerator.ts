import * as yaml from 'js-yaml';
import { calculateAllStats } from '@/utils/pokemonStatsCalculator';
import { PokemonStats, PokemonIVs, PokemonEVs } from '@/types/auth';
import { ExtendedAbilityData, generateTemplateAbilityConfig } from '@/utils/abilityDataProcessor';

// 模板数据接口
export interface TemplateData {
  level: number;
  nature: string;
  ability: string;
  item: string;
  moves: string[];
  types: {
    english: string[];
    chinese: string[];
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    spDefense: number;
    speed: number;
  };
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    spDefense: number;
    speed: number;
  };
}

// 完整的模板接口
export interface Template {
  name: string;
  pokemonId: number;
  isPublic: boolean;
  templateData: TemplateData;
}

// Pokemon信息接口
export interface PokemonInfo {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
}

// YAML模板数据结构
export interface YamlTemplateData {
  id: string;
  metadata: {
    name: string;
    version: string;
    created_at: string;
    generator: string;
  };
  pokemon: {
    id: number;
    name: string;
    types: string[];
    types_chinese: string[];
  };
  configuration: {
    level: number;
    nature: string;
    ability: {
      name: string;
      text?: string;
      special_type?: 'defensive' | 'offensive';
      special_config?: {
        effect: string;
        trigger: string;
        remarks?: string;
      };
    };
    item: string;
    moves: string[];
  };
  stats: {
    evs: {
      hp: number;
      attack: number;
      defense: number;
      special_attack: number;
      special_defense: number;
      speed: number;
    };
    ivs: {
      hp: number;
      attack: number;
      defense: number;
      special_attack: number;
      special_defense: number;
      speed: number;
    };
    calculated_stats: {
      hp: number;
      attack: number;
      defense: number;
      special_attack: number;
      special_defense: number;
      speed: number;
    };
  };
  settings: {
    is_public: boolean;
  };
}

/**
 * 生成简单的雪花ID（临时实现）
 */
function generateSimpleId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}${random.toString().padStart(3, '0')}`;
}

// 计算最终能力值的辅助函数
function calculateFinalStats(template: Template, pokemonInfo?: PokemonInfo) {
  // 获取基础能力值，如果pokemonInfo为空则使用默认值
  const baseStats = pokemonInfo?.baseStats ? {
    hp: pokemonInfo.baseStats.HP,
    attack: pokemonInfo.baseStats.Attack,
    defense: pokemonInfo.baseStats.Defense,
    specialAttack: pokemonInfo.baseStats['Sp. Attack'],
    spDefense: pokemonInfo.baseStats['Sp. Defense'],
    speed: pokemonInfo.baseStats.Speed
  } : {
    hp: 100,
    attack: 100,
    defense: 100,
    specialAttack: 100,
    spDefense: 100,
    speed: 100
  };

  // 转换个体值和努力值格式
  const ivs = {
    hp: template.templateData.ivs.hp,
    attack: template.templateData.ivs.attack,
    defense: template.templateData.ivs.defense,
    specialAttack: template.templateData.ivs.specialAttack,
    spDefense: template.templateData.ivs.spDefense,
    speed: template.templateData.ivs.speed
  };

  const evs = {
    hp: template.templateData.evs.hp,
    attack: template.templateData.evs.attack,
    defense: template.templateData.evs.defense,
    specialAttack: template.templateData.evs.specialAttack,
    spDefense: template.templateData.evs.spDefense,
    speed: template.templateData.evs.speed
  };

  // 计算最终能力值
  const calculatedStats = calculateAllStats(
    baseStats,
    ivs,
    evs,
    template.templateData.level,
    template.templateData.nature
  );

  return {
    hp: calculatedStats.hp,
    attack: calculatedStats.attack,
    defense: calculatedStats.defense,
    special_attack: calculatedStats.specialAttack,
    special_defense: calculatedStats.spDefense,
    speed: calculatedStats.speed
  };
}

/**
 * 生成带注释的YAML模板数据
 * @param template 模板数据
 * @param pokemonInfo Pokemon信息
 * @param abilityData 特性数据
 * @returns 格式化的YAML字符串
 */
export async function generateYamlTemplate(
  template: Template,
  pokemonInfo?: PokemonInfo,
  abilityData?: ExtendedAbilityData
): Promise<string> {
  try {
    // 生成简单ID（临时实现）
    const traceId = generateSimpleId();

    // 构建YAML数据结构
    const yamlData: YamlTemplateData = {
      id: traceId,
      metadata: {
        name: template.name,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        generator: 'LuoXue Template Creator'
      },
      pokemon: {
        id: template.pokemonId,
        name: pokemonInfo?.name || `Pokemon #${template.pokemonId}`,
        types: pokemonInfo?.types || [],
        types_chinese: template.templateData.types?.chinese || []
      },
      configuration: {
        level: template.templateData.level,
        nature: template.templateData.nature,
        ability: abilityData ? await generateTemplateAbilityConfig(abilityData) : {
          name: template.templateData.ability || ''
        },
        item: template.templateData.item,
        moves: template.templateData.moves.filter(move => move.trim() !== '')
      },
      stats: {
        evs: {
          hp: template.templateData.evs.hp,
          attack: template.templateData.evs.attack,
          defense: template.templateData.evs.defense,
          special_attack: template.templateData.evs.specialAttack,
          special_defense: template.templateData.evs.spDefense,
          speed: template.templateData.evs.speed
        },
        ivs: {
          hp: template.templateData.ivs.hp,
          attack: template.templateData.ivs.attack,
          defense: template.templateData.ivs.defense,
          special_attack: template.templateData.ivs.specialAttack,
          special_defense: template.templateData.ivs.spDefense,
          speed: template.templateData.ivs.speed
        },
        calculated_stats: calculateFinalStats(template, pokemonInfo)
      },
      settings: {
        is_public: template.isPublic
      }
    };

    // 生成YAML字符串
    const yamlString = yaml.dump(yamlData, {
      indent: 2,
      lineWidth: 80,
      noRefs: true,
      sortKeys: false
    });

    // 添加详细注释
    const commentedYaml = addYamlComments(yamlString, template, pokemonInfo, abilityData);
    
    return commentedYaml;
  } catch (error) {
    console.error('生成YAML模板时出错:', error);
    throw new Error('生成YAML模板失败');
  }
}

/**
 * 为YAML添加简化注释
 * @param yamlString 原始YAML字符串
 * @param template 模板数据
 * @param pokemonInfo Pokemon信息
 * @param abilityData 特性数据
 * @returns 带注释的YAML字符串
 */
function addYamlComments(
  yamlString: string,
  template: Template,
  pokemonInfo?: PokemonInfo,
  abilityData?: ExtendedAbilityData
): string {
  const lines = yamlString.split('\n');
  const commentedLines: string[] = [];

  // 添加简化的文件头注释
  commentedLines.push('# Pokemon对战模板');
  commentedLines.push('');

  let inSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 检测当前所在的节
    if (trimmedLine.startsWith('id:')) {
      commentedLines.push(line);
    } else if (trimmedLine.startsWith('metadata:')) {
      commentedLines.push('# 模板信息');
      commentedLines.push(line);
      inSection = 'metadata';
    } else if (trimmedLine.startsWith('pokemon:')) {
      commentedLines.push('');
      commentedLines.push('# Pokemon基本信息');
      commentedLines.push(line);
      inSection = 'pokemon';
    } else if (trimmedLine.startsWith('configuration:')) {
      commentedLines.push('');
      commentedLines.push('# 配置信息');
      commentedLines.push(line);
      inSection = 'configuration';
    } else if (trimmedLine.startsWith('stats:')) {
      commentedLines.push('');
      commentedLines.push('# 能力值');
      commentedLines.push(line);
      inSection = 'stats';
    } else if (trimmedLine.startsWith('settings:')) {
      commentedLines.push('');
      commentedLines.push('# 设置');
      commentedLines.push(line);
      inSection = 'settings';
    } else if (trimmedLine.startsWith('evs:')) {
      commentedLines.push('  # 努力值 (总和≤510)');
      commentedLines.push(line);
    } else if (trimmedLine.startsWith('ivs:')) {
      commentedLines.push('  # 个体值 (0-31)');
      commentedLines.push(line);
    } else if (trimmedLine.startsWith('calculated_stats:')) {
      commentedLines.push('  # 计算后的最终能力值');
      commentedLines.push(line);
    } else {
      // 只为关键字段添加简短注释
      if (inSection === 'configuration') {
        if (trimmedLine.includes('level:')) {
          commentedLines.push(line + '  # 等级');
        } else if (trimmedLine.includes('nature:')) {
          commentedLines.push(line + '  # 性格');
        } else if (trimmedLine.includes('ability:')) {
          if (abilityData?.specialType) {
            const typeText = abilityData.specialType === 'defensive' ? '防守特性' : '进攻特性';
            commentedLines.push(line + `  # 特性 (${typeText})`);
          } else {
            commentedLines.push(line + '  # 特性');
          }
        } else if (trimmedLine.includes('name:') && inSection === 'configuration' && abilityData) {
          // 为特性名称添加描述
          if (abilityData.text) {
            commentedLines.push(line + `  # ${abilityData.text}`);
          } else {
            commentedLines.push(line);
          }
        } else if (trimmedLine.includes('effect:') && inSection === 'configuration' && abilityData?.specialConfig) {
          commentedLines.push(line + '  # 特殊效果');
        } else if (trimmedLine.includes('trigger:') && inSection === 'configuration' && abilityData?.specialConfig) {
          commentedLines.push(line + '  # 触发条件');
        } else if (trimmedLine.includes('item:')) {
          commentedLines.push(line + '  # 道具');
        } else if (trimmedLine.includes('moves:')) {
          commentedLines.push(line + '  # 技能');
        } else {
          commentedLines.push(line);
        }
      } else {
        commentedLines.push(line);
      }
    }
  }

  return commentedLines.join('\n');
}

/**
 * 下载YAML文件
 * @param yamlContent YAML内容
 * @param filename 文件名
 */
export function downloadYamlFile(yamlContent: string, filename: string): void {
  try {
    const blob = new Blob([yamlContent], { type: 'application/x-yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.yaml') ? filename : `${filename}.yaml`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载YAML文件时出错:', error);
    throw new Error('下载文件失败');
  }
}

/**
 * 计算努力值总和
 * @param evs 努力值对象
 * @returns 总和
 */
export function calculateEVTotal(evs: TemplateData['evs']): number {
  return Object.values(evs).reduce((sum, value) => sum + value, 0);
}

/**
 * 验证努力值是否有效
 * @param evs 努力值对象
 * @returns 验证结果
 */
export function validateEVs(evs: TemplateData['evs']): { isValid: boolean; message?: string } {
  const total = calculateEVTotal(evs);
  
  if (total > 510) {
    return { isValid: false, message: '努力值总和不能超过510' };
  }
  
  for (const [key, value] of Object.entries(evs)) {
    if (value < 0 || value > 252) {
      return { isValid: false, message: `${key}的努力值必须在0-252之间` };
    }
  }
  
  return { isValid: true };
}

/**
 * 验证个体值是否有效
 * @param ivs 个体值对象
 * @returns 验证结果
 */
export function validateIVs(ivs: TemplateData['ivs']): { isValid: boolean; message?: string } {
  for (const [key, value] of Object.entries(ivs)) {
    if (value < 0 || value > 31) {
      return { isValid: false, message: `${key}的个体值必须在0-31之间` };
    }
  }
  
  return { isValid: true };
}