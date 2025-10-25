/**
 * 宝可梦伤害计算器类型定义
 * Pokemon Damage Calculator Type Definitions
 */

// 重新导出现有的类型，保持兼容性
export type {
  Stats,
  Pokemon,
  Move,
  DamageResult
} from '@/lib/pokemonDamageCalculator';

// 模板元数据
export interface TemplateMetadata {
  name: string;
  version: string;
  created_at: string;
  generator: string;
}

// 宝可梦基础信息
export interface PokemonInfo {
  id: number;
  name: string;
  types: string[];
  types_chinese: string[];
}

// 特性信息
export interface AbilityInfo {
  name: string;
  index: string;
  common_count: number;
  hidden_count: number;
  isSpecial: boolean;
  specialType: 'offensive' | 'defensive';
  effect: string;
  trigger_condition: string;
  note: string;
}

// 配置信息
export interface PokemonConfiguration {
  level: number;
  nature: string;
  ability: AbilityInfo;
  item: string;
  moves: string[];
}

// 能力值数据
export interface StatsData {
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
}

// 完整模板结构
export interface PokemonTemplate {
  id: string;
  metadata: TemplateMetadata;
  pokemon: PokemonInfo;
  configuration: PokemonConfiguration;
  stats: StatsData;
  settings: {
    is_public: boolean;
  };
}

// 计算器状态
export interface CalculatorPokemonState {
  // 基础信息
  id?: number;
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
  
  // 配置信息
  level: number;
  nature: string;
  ability: string;
  item: string;
  
  // 个体值 (0-31)
  ivs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  
  // 努力值 (0-252 per stat, max 510 total)
  evs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  
  // 招式
  moves?: string[];
  
  // 状态效果
  status?: string; // burn, freeze, etc.
  weather?: string; // sunny, rain, sandstorm, hail
  screens?: string[]; // reflect, light_screen
  assistStatus?: string; // help, etc.
}

// 招式信息
export interface MoveInfo {
  id: number;
  name: string;
  power: number;
  type: string;
  category: '物理' | '特殊'; // Physical or Special
  accuracy: number;
}

// 计算器主状态
export interface DamageCalculatorState {
  attacker: CalculatorPokemonState;
  defender: CalculatorPokemonState;
  battleConditions: {
    weather: string;
    terrain: string;
    criticalHit: boolean;
    randomFactor: number; // 0.85 - 1.0
  };
}

// 性格修正数据
export interface NatureModifiers {
  name?: string;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

// 最终计算的能力值
export interface FinalStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

// 计算等式步骤
export interface CalculationEquation {
  step: string;
  formula: string;
  values: { [key: string]: number };
  result: number;
}

// 详细的调试信息
export interface DebugInfo {
  // 性格修正
  attackerNature: NatureModifiers;
  defenderNature: NatureModifiers;
  attackerNatureModifiers: NatureModifiers;
  defenderNatureModifiers: NatureModifiers;
  
  // 随机因子
  randomFactor: number;
  
  // 天气和场地影响
  weatherEffect: {
    name: string;
    multiplier: number;
    description: string;
  };
  terrainEffect: {
    name: string;
    multiplier: number;
    description: string;
  };
  
  // 属性相克
  typeEffectiveness: {
    attackType: string;
    defenderTypes: string[];
    multiplier: number;
    effectiveness: string; // "超级有效", "有效", "不很有效", "无效"
  };
  
  // IV和EV
  attackerIVs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  defenderIVs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  attackerEVs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  defenderEVs: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
  
  // 最终计算的能力值
  attackerFinalStats: FinalStats;
  defenderFinalStats: FinalStats;
  
  // 数学计算等式
  calculationEquations: CalculationEquation[];
  
  // 基础伤害计算公式
  baseDamageFormula: {
    level: number;
    power: number;
    attack: number;
    defense: number;
    result: number;
    formula: string;
  };
}

// 单个招式的伤害计算结果
export interface SingleMoveResult {
  move: MoveInfo;
  damage: number;
  baseDamage: number;
  damageRange: number[]; // 16 possible damage values
  percentage: {
    min: number;
    max: number;
    average: number;
  };
  koChance: {
    ohko: number; // One-hit KO probability
    '2hko': number; // Two-hit KO probability
  };
  modifiers: {
    otherModifiers: number;
    criticalMultiplier: number;
    randomFactor: number;
    stabMultiplier: number;
    typeMultiplier: number;
    finalModifier: number;
    attackerItemMultiplier: number;
    defenderItemMultiplier: number;
  };
  calculationSteps: {
    step1OtherCritical: number;
    step2Random: number;
    step3Stab: number;
    step4Type: number;
  };
  statsUsed: {
    attackStat: number;
    defenseStat: number;
  };
  itemsUsed: {
    attackerItem: string;
    defenderItem: string;
  };
  // 新增调试信息
  debugInfo?: DebugInfo;
}

// 单方向伤害计算结果
export interface DirectionalDamageResult {
  moves: SingleMoveResult[];
  attackerName: string;
  defenderName: string;
}

// 扩展的伤害计算结果（支持双向计算）
export interface ExtendedDamageResult {
  pokemonAToB: DirectionalDamageResult; // 精灵A对精灵B的伤害
  pokemonBToA: DirectionalDamageResult; // 精灵B对精灵A的伤害
  pokemonAName: string;
  pokemonBName: string;
}

// 模板搜索和过滤
export interface TemplateFilter {
  search: string;
  types: string[];
  level?: number;
  sortBy: 'name' | 'created_at' | 'level';
  sortOrder: 'asc' | 'desc';
}

// API返回的扁平化模板数据格式
export interface FlattenedTemplate {
  id: string;
  name: string;
  level: number;
  nature: string;
  ability: string;
  item?: string;
  pokemonId: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  pokemon: {
    id: number;
    nameChinese: string;
    types: string[];
  };
  moves: Array<{
    id: string;
    moveId: number;
    moveName: string;
    moveCategory: string;
    position: number;
  }>;
  ivs: any;
  evs: any;
  _count: {
    favorites: number;
  };
}

// API响应类型
export interface TemplateListResponse {
  data: FlattenedTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplateResponse {
  template: PokemonTemplate | null;
  success: boolean;
  error?: string;
}

// 计算器上下文类型
export interface DamageCalculatorContextType {
  state: DamageCalculatorState;
  result: ExtendedDamageResult | null;
  
  // 状态更新方法
  updateAttacker: (updates: Partial<CalculatorPokemonState>) => void;
  updateDefender: (updates: Partial<CalculatorPokemonState>) => void;
  updateBattleConditions: (conditions: Partial<DamageCalculatorState['battleConditions']>) => void;
  
  // 计算方法
  calculateDamage: () => void;
  
  // 模板方法
  loadTemplate: (template: PokemonTemplate, target: 'attacker' | 'defender') => void;
  exportTemplate: (target: 'attacker' | 'defender') => PokemonTemplate;
  
  // 重置方法
  resetCalculator: () => void;
  resetPokemon: (target: 'attacker' | 'defender') => void;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
}

// 默认值常量
export const DEFAULT_POKEMON_STATE: CalculatorPokemonState = {
  name: '',
  types: [],
  baseStats: {
    HP: 0,
    Attack: 0,
    Defense: 0,
    'Sp. Attack': 0,
    'Sp. Defense': 0,
    Speed: 0
  },
  level: 50,
  nature: '勤奋',
  ability: '',
  item: '',
  ivs: {
    HP: 31,
    Attack: 31,
    Defense: 31,
    'Sp. Attack': 31,
    'Sp. Defense': 31,
    Speed: 31
  },
  evs: {
    HP: 0,
    Attack: 0,
    Defense: 0,
    'Sp. Attack': 0,
    'Sp. Defense': 0,
    Speed: 0
  }
};

export const DEFAULT_BATTLE_CONDITIONS = {
  weather: '',
  terrain: '',
  criticalHit: false,
  randomFactor: 0.85 + Math.random() * 0.15 // Random between 0.85 and 1.0
};

// 性格列表
export const NATURES = [
  '勤奋', '怕寂寞', '固执', '顽皮', '勇敢', '大胆', '坦率', '悠闲', 
  '淘气', '乐天', '胆小', '急躁', '认真', '爽朗', '天真', '内敛', 
  '慢吞吞', '冷静', '温和', '温顺', '马虎', '慎重', '浮躁', '沉着', '害羞'
];

// 天气效果
export const WEATHER_CONDITIONS = [
  '', '晴天', '雨天', '沙暴', '冰雹', '强烈阳光', '大雨', '乱流', '始源之海', '终结之地'
];

// 场地效果
export const TERRAIN_CONDITIONS = [
  '', '电气场地', '青草场地', '薄雾场地', '精神场地'
];