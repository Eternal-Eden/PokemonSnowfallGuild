// 宝可梦伤害计算器工具函数

export interface DamageCalculationParams {
  // 攻击方数据
  attackerLevel: number;
  attackerAttack: number;
  attackerNature: string;
  attackerAbility: string;
  attackerItem: string;
  
  // 防御方数据
  defenderLevel: number;
  defenderHP: number;
  defenderDefense: number;
  defenderNature: string;
  defenderAbility: string;
  defenderItem: string;
  
  // 招式数据
  movePower: number;
  moveType: string;
  moveCategory: 'physical' | 'special';
  
  // 战斗条件
  weather: string;
  terrain: string;
  criticalHit: boolean;
  stab: boolean; // 本系加成
  
  // 宝可梦属性
  attackerTypes: string[];
  defenderTypes: string[];
}

export interface DamageResult {
  minDamage: number;
  maxDamage: number;
  averageDamage: number;
  damagePercentage: number;
  isKO: boolean;
  description: string;
}

// 性格修正表
const natureModifiers: Record<string, { attack: number; defense: number; specialAttack: number; specialDefense: number }> = {
  '固执': { attack: 1.1, defense: 1.0, specialAttack: 0.9, specialDefense: 1.0 },
  '开朗': { attack: 1.1, defense: 1.0, specialAttack: 1.0, specialDefense: 0.9 },
  '勇敢': { attack: 1.1, defense: 1.0, specialAttack: 1.0, specialDefense: 1.0 },
  '调皮': { attack: 1.1, defense: 0.9, specialAttack: 1.0, specialDefense: 1.0 },
  '大胆': { attack: 0.9, defense: 1.1, specialAttack: 1.0, specialDefense: 1.0 },
  '温和': { attack: 1.0, defense: 1.0, specialAttack: 1.1, specialDefense: 0.9 },
  '冷静': { attack: 1.0, defense: 1.0, specialAttack: 1.1, specialDefense: 1.0 },
};

// 属性相性表（简化版）
const typeEffectiveness: Record<string, Record<string, number>> = {
  '火': { '草': 2, '冰': 2, '虫': 2, '钢': 2, '水': 0.5, '火': 0.5, '岩石': 0.5, '龙': 0.5 },
  '水': { '火': 2, '地面': 2, '岩石': 2, '草': 0.5, '水': 0.5, '龙': 0.5 },
  '草': { '水': 2, '地面': 2, '岩石': 2, '火': 0.5, '草': 0.5, '毒': 0.5, '飞行': 0.5, '虫': 0.5, '龙': 0.5, '钢': 0.5 },
  '电': { '水': 2, '飞行': 2, '电': 0.5, '草': 0.5, '龙': 0.5, '地面': 0 },
  // 可以添加更多属性相性
};

// 获取属性相性倍率
function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let effectiveness = 1;
  
  defenderTypes.forEach(defenderType => {
    if (typeEffectiveness[moveType] && typeEffectiveness[moveType][defenderType] !== undefined) {
      effectiveness *= typeEffectiveness[moveType][defenderType];
    }
  });
  
  return effectiveness;
}

// 获取性格修正
function getNatureModifier(nature: string, category: 'physical' | 'special'): number {
  const modifier = natureModifiers[nature];
  if (!modifier) return 1;
  
  return category === 'physical' ? modifier.attack : modifier.specialAttack;
}

// 获取天气修正
function getWeatherModifier(weather: string, moveType: string): number {
  switch (weather) {
    case '晴天':
      return moveType === '火' ? 1.5 : moveType === '水' ? 0.5 : 1;
    case '雨天':
      return moveType === '水' ? 1.5 : moveType === '火' ? 0.5 : 1;
    default:
      return 1;
  }
}

// 主要伤害计算函数
export function calculateDamage(params: DamageCalculationParams): DamageResult {
  const {
    attackerLevel,
    attackerAttack,
    attackerNature,
    defenderHP,
    defenderDefense,
    defenderNature,
    movePower,
    moveType,
    moveCategory,
    weather,
    criticalHit,
    stab,
    attackerTypes,
    defenderTypes
  } = params;

  // 基础伤害计算公式
  // Damage = ((((2 * Level / 5 + 2) * Power * A / D) / 50) + 2) * Modifiers
  
  // 应用性格修正
  const attackStat = Math.floor(attackerAttack * getNatureModifier(attackerNature, moveCategory));
  const defenseStat = Math.floor(defenderDefense * getNatureModifier(defenderNature, moveCategory));
  
  // 基础伤害
  const baseDamage = Math.floor(
    (Math.floor(
      Math.floor(
        (2 * attackerLevel / 5 + 2) * movePower * attackStat / defenseStat
      ) / 50
    ) + 2)
  );
  
  // 修正倍率
  let modifier = 1;
  
  // 会心一击
  if (criticalHit) {
    modifier *= 1.5;
  }
  
  // 本系加成
  if (stab && attackerTypes.includes(moveType)) {
    modifier *= 1.5;
  }
  
  // 属性相性
  const typeEffectivenessMultiplier = getTypeEffectiveness(moveType, defenderTypes);
  modifier *= typeEffectivenessMultiplier;
  
  // 天气修正
  modifier *= getWeatherModifier(weather, moveType);
  
  // 随机因子 (85-100%)
  const minDamage = Math.floor(baseDamage * modifier * 0.85);
  const maxDamage = Math.floor(baseDamage * modifier * 1.0);
  const averageDamage = Math.floor((minDamage + maxDamage) / 2);
  
  // 伤害百分比
  const damagePercentage = Math.round((averageDamage / defenderHP) * 100);
  
  // 是否一击必杀
  const isKO = minDamage >= defenderHP;
  
  // 生成描述
  let description = `${minDamage}-${maxDamage} (${damagePercentage}%)`;
  
  if (typeEffectivenessMultiplier > 1) {
    description += ' 效果拔群!';
  } else if (typeEffectivenessMultiplier < 1 && typeEffectivenessMultiplier > 0) {
    description += ' 效果不理想...';
  } else if (typeEffectivenessMultiplier === 0) {
    description = '没有效果...';
  }
  
  if (criticalHit) {
    description += ' 会心一击!';
  }
  
  if (isKO) {
    description += ' 一击必杀!';
  }
  
  return {
    minDamage,
    maxDamage,
    averageDamage,
    damagePercentage,
    isKO,
    description
  };
}

// 快速计算函数（用于实时预览）
export function quickCalculate(
  attackerLevel: number,
  attackerAttack: number,
  defenderHP: number,
  defenderDefense: number,
  movePower: number,
  moveType: string,
  attackerTypes: string[] = [],
  defenderTypes: string[] = []
): string {
  const params: DamageCalculationParams = {
    attackerLevel,
    attackerAttack,
    attackerNature: '固执',
    attackerAbility: '',
    attackerItem: '',
    defenderLevel: 50,
    defenderHP,
    defenderDefense,
    defenderNature: '大胆',
    defenderAbility: '',
    defenderItem: '',
    movePower,
    moveType,
    moveCategory: 'physical',
    weather: '无',
    terrain: '无',
    criticalHit: false,
    stab: attackerTypes.includes(moveType),
    attackerTypes,
    defenderTypes
  };
  
  const result = calculateDamage(params);
  return `${result.minDamage}-${result.maxDamage} (${result.damagePercentage}%)`;
}