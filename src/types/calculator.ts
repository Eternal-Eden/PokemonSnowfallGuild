// Calculator Types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowState {
  position: Position;
  size: Size;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface PokemonData {
  id: string;
  name: string;
  type1: string;
  type2?: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

export interface CalculatorPokemon {
  pokemon: PokemonData | null;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  nature: string;
  ability: string;
  item: string;
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

export interface CalculatorMove {
  name: string;
  power: number;
  type: string;
  category: 'physical' | 'special';
  accuracy: number;
}

export interface BattleConditions {
  weather: string;
  terrain: string;
  criticalHit: boolean;
  stab: boolean;
  screens: string[];
  otherModifiers: number;
}

export interface CalculatorState {
  attacker: CalculatorPokemon;
  defender: CalculatorPokemon;
  move: CalculatorMove;
  conditions: BattleConditions;
}

export interface DamageCalculationResult {
  minDamage: number;
  maxDamage: number;
  averageDamage: number;
  damageRange: number[];
  percentage: {
    min: number;
    max: number;
    average: number;
  };
  koChance: number;
  modifiers: {
    attack: number;
    defense: number;
    power: number;
    stab: number;
    typeEffectiveness: number;
    weather: number;
    critical: number;
    other: number;
  };
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  type: 'damage' | 'speed' | 'bulk' | 'utility';
  data: Partial<CalculatorState>;
  createdAt: string;
  updatedAt: string;
  author: string;
  isPublic: boolean;
  likes: number;
  downloads: number;
}

export interface TemplateFilter {
  search: string;
  tags: string[];
  type: string;
  sortBy: 'name' | 'date' | 'likes' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

export interface CalculatorContextType {
  state: CalculatorState;
  updateAttacker: (updates: Partial<CalculatorPokemon>) => void;
  updateDefender: (updates: Partial<CalculatorPokemon>) => void;
  updateMove: (updates: Partial<CalculatorMove>) => void;
  updateConditions: (updates: Partial<BattleConditions>) => void;
  calculateDamage: () => DamageCalculationResult;
  resetCalculator: () => void;
  loadTemplate: (template: TemplateData) => void;
  saveTemplate: (name: string, description: string, tags: string[]) => Promise<void>;
  templates: TemplateData[];
  isLoading: boolean;
  error: string | null;
}

// Nature modifiers
export const NATURE_MODIFIERS: Record<string, { increase?: keyof CalculatorPokemon['ivs']; decrease?: keyof CalculatorPokemon['ivs'] }> = {
  '勤奋': {}, // Hardy
  '固执': { increase: 'attack', decrease: 'spAttack' }, // Adamant
  '内敛': { increase: 'spAttack', decrease: 'attack' }, // Modest
  '胆小': { increase: 'speed', decrease: 'attack' }, // Timid
  '大胆': { increase: 'defense', decrease: 'attack' }, // Bold
  '沉着': { increase: 'spDefense', decrease: 'attack' }, // Calm
  '慎重': { increase: 'spDefense', decrease: 'spAttack' }, // Careful
  '开朗': { increase: 'speed', decrease: 'spAttack' }, // Jolly
  '淘气': { increase: 'attack', decrease: 'spDefense' }, // Naughty
  '勇敢': { increase: 'attack', decrease: 'speed' }, // Brave
  '孤僻': { increase: 'defense', decrease: 'spAttack' }, // Impish
  '悠闲': { increase: 'defense', decrease: 'speed' }, // Relaxed
  '冷静': { increase: 'spAttack', decrease: 'speed' }, // Quiet
  '温和': { increase: 'spDefense', decrease: 'defense' }, // Gentle
  '马虎': { increase: 'spDefense', decrease: 'speed' }, // Sassy
  '急躁': { increase: 'speed', decrease: 'defense' }, // Hasty
  '天真': { increase: 'speed', decrease: 'spDefense' }, // Naive
};

// Type effectiveness chart
export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  '一般': { '岩石': 0.5, '幽灵': 0, '钢': 0.5 },
  '格斗': { '一般': 2, '飞行': 0.5, '毒': 0.5, '岩石': 2, '虫': 0.5, '幽灵': 0, '钢': 2, '火': 1, '水': 1, '草': 1, '电': 1, '超能力': 0.5, '冰': 2, '龙': 1, '恶': 2, '妖精': 0.5 },
  '飞行': { '格斗': 2, '地面': 0, '岩石': 0.5, '虫': 2, '钢': 0.5, '火': 1, '水': 1, '草': 2, '电': 0.5, '超能力': 1, '冰': 1, '龙': 1, '恶': 1, '妖精': 1 },
  '毒': { '格斗': 1, '毒': 0.5, '地面': 0.5, '岩石': 0.5, '虫': 1, '幽灵': 0.5, '钢': 0, '火': 1, '水': 1, '草': 2, '电': 1, '超能力': 1, '冰': 1, '龙': 1, '恶': 1, '妖精': 2 },
  '地面': { '飞行': 0, '毒': 2, '岩石': 2, '虫': 0.5, '钢': 2, '火': 2, '水': 1, '草': 0.5, '电': 2, '超能力': 1, '冰': 1, '龙': 1, '恶': 1, '妖精': 1 },
  '岩石': { '格斗': 0.5, '飞行': 2, '地面': 0.5, '虫': 2, '钢': 0.5, '火': 2, '水': 1, '草': 1, '电': 1, '超能力': 1, '冰': 2, '龙': 1, '恶': 1, '妖精': 1 },
  '虫': { '格斗': 0.5, '飞行': 0.5, '毒': 0.5, '岩石': 1, '幽灵': 0.5, '钢': 0.5, '火': 0.5, '水': 1, '草': 2, '电': 1, '超能力': 2, '冰': 1, '龙': 1, '恶': 2, '妖精': 0.5 },
  '幽灵': { '一般': 0, '格斗': 0, '毒': 1, '岩石': 1, '虫': 1, '幽灵': 2, '钢': 1, '火': 1, '水': 1, '草': 1, '电': 1, '超能力': 2, '冰': 1, '龙': 1, '恶': 0.5, '妖精': 1 },
  '钢': { '岩石': 2, '钢': 0.5, '火': 0.5, '水': 0.5, '电': 0.5, '冰': 2, '妖精': 2 },
  '火': { '岩石': 0.5, '虫': 2, '钢': 2, '火': 0.5, '水': 0.5, '草': 2, '电': 1, '超能力': 1, '冰': 2, '龙': 0.5, '恶': 1, '妖精': 1 },
  '水': { '地面': 2, '岩石': 2, '火': 2, '水': 0.5, '草': 0.5, '电': 1, '超能力': 1, '冰': 1, '龙': 0.5, '恶': 1, '妖精': 1 },
  '草': { '飞行': 0.5, '毒': 0.5, '地面': 2, '岩石': 2, '虫': 0.5, '钢': 0.5, '火': 0.5, '水': 2, '草': 0.5, '电': 1, '超能力': 1, '冰': 1, '龙': 0.5, '恶': 1, '妖精': 1 },
  '电': { '飞行': 2, '地面': 0, '水': 2, '草': 0.5, '电': 0.5, '超能力': 1, '冰': 1, '龙': 0.5, '恶': 1, '妖精': 1 },
  '超能力': { '格斗': 2, '毒': 2, '超能力': 0.5, '钢': 0.5, '恶': 0, '妖精': 1 },
  '冰': { '飞行': 2, '地面': 2, '岩石': 1, '钢': 0.5, '火': 0.5, '水': 0.5, '草': 2, '冰': 0.5, '龙': 2, '恶': 1, '妖精': 1 },
  '龙': { '钢': 0.5, '火': 1, '水': 1, '草': 1, '电': 1, '超能力': 1, '冰': 1, '龙': 2, '恶': 1, '妖精': 0 },
  '恶': { '格斗': 0.5, '幽灵': 2, '超能力': 2, '恶': 0.5, '妖精': 0.5 },
  '妖精': { '格斗': 2, '毒': 0.5, '钢': 0.5, '火': 0.5, '龙': 2, '恶': 2 }
};

// 只导出常量值，不导出类型
export default {
  NATURE_MODIFIERS,
  TYPE_EFFECTIVENESS
};