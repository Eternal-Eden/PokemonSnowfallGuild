// 宝可梦数值计算工具

import { PokemonStats, PokemonIVs, PokemonEVs } from '@/types/auth';

// 性格修正数据
export interface NatureModifier {
  name: string;
  HP: number;
  Attack: number;
  Defense: number;
  Sp_Attack: number;
  Sp_Defense: number;
  Speed: number;
}

// 性格修正表
export const natureModifiers: Record<string, NatureModifier> = {
  '勤奋': { name: '勤奋', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 },
  '怕寂寞': { name: '怕寂寞', HP: 1.0, Attack: 1.1, Defense: 0.9, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 },
  '固执': { name: '固执', HP: 1.0, Attack: 1.1, Defense: 1.0, Sp_Attack: 0.9, Sp_Defense: 1.0, Speed: 1.0 },
  '顽皮': { name: '顽皮', HP: 1.0, Attack: 1.1, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 0.9, Speed: 1.0 },
  '勇敢': { name: '勇敢', HP: 1.0, Attack: 1.1, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 0.9 },
  '大胆': { name: '大胆', HP: 1.0, Attack: 0.9, Defense: 1.1, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 },
  '坦率': { name: '坦率', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 },
  '悠闲': { name: '悠闲', HP: 1.0, Attack: 1.0, Defense: 1.1, Sp_Attack: 0.9, Sp_Defense: 1.0, Speed: 1.0 },
  '淘气': { name: '淘气', HP: 1.0, Attack: 1.0, Defense: 1.1, Sp_Attack: 1.0, Sp_Defense: 0.9, Speed: 1.0 },
  '乐天': { name: '乐天', HP: 1.0, Attack: 1.0, Defense: 1.1, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 0.9 },
  '胆小': { name: '胆小', HP: 1.0, Attack: 0.9, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.1 },
  '急躁': { name: '急躁', HP: 1.0, Attack: 1.0, Defense: 0.9, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.1 },
  '认真': { name: '认真', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 },
  '爽朗': { name: '爽朗', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 0.9, Sp_Defense: 1.0, Speed: 1.1 },
  '天真': { name: '天真', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 0.9, Speed: 1.1 },
  '内敛': { name: '内敛', HP: 1.0, Attack: 0.9, Defense: 1.0, Sp_Attack: 1.1, Sp_Defense: 1.0, Speed: 1.0 },
  '慢吞吞': { name: '慢吞吞', HP: 1.0, Attack: 1.0, Defense: 0.9, Sp_Attack: 1.1, Sp_Defense: 1.0, Speed: 1.0 },
  '冷静': { name: '冷静', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.1, Sp_Defense: 1.0, Speed: 0.9 },
  '温和': { name: '温和', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.1, Sp_Defense: 0.9, Speed: 1.0 },
  '温顺': { name: '温顺', HP: 1.0, Attack: 0.9, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.1, Speed: 1.0 },
  '马虎': { name: '马虎', HP: 1.0, Attack: 1.0, Defense: 0.9, Sp_Attack: 1.0, Sp_Defense: 1.1, Speed: 1.0 },
  '慎重': { name: '慎重', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 0.9, Sp_Defense: 1.1, Speed: 1.0 },
  '浮躁': { name: '浮躁', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.1, Speed: 0.9 },
  '沉着': { name: '沉着', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.1, Speed: 0.9 },
  '害羞': { name: '害羞', HP: 1.0, Attack: 1.0, Defense: 1.0, Sp_Attack: 1.0, Sp_Defense: 1.0, Speed: 1.0 }
};

// 计算单项能力值
export function calculateStat(
  baseStat: number,
  iv: number,
  ev: number,
  level: number,
  natureModifier: number,
  isHP: boolean = false
): number {
  if (isHP) {
    // HP计算公式: ((种族值 × 2 + 个体值 + 努力值/4) × 等级/100) + 10 + 等级
    return Math.floor(((baseStat * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 10 + level;
  } else {
    // 其他能力值计算公式: (((种族值 × 2 + 个体值 + 努力值/4) × 等级/100) + 5) × 性格修正
    return Math.floor((Math.floor(((baseStat * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureModifier);
  }
}

// 计算所有能力值
export function calculateAllStats(
  baseStats: PokemonStats,
  ivs: PokemonIVs,
  evs: PokemonEVs,
  level: number,
  nature: string
): PokemonStats {
  const natureModifier = natureModifiers[nature] || natureModifiers['勤奋'];
  
  return {
    hp: calculateStat(baseStats.hp, ivs.hp, evs.hp, level, 1.0, true),
    attack: calculateStat(baseStats.attack, ivs.attack, evs.attack, level, natureModifier.Attack),
    defense: calculateStat(baseStats.defense, ivs.defense, evs.defense, level, natureModifier.Defense),
    specialAttack: calculateStat(baseStats.specialAttack, ivs.specialAttack, evs.specialAttack, level, natureModifier.Sp_Attack),
    spDefense: calculateStat(baseStats.spDefense, ivs.spDefense, evs.spDefense, level, natureModifier.Sp_Defense),
    speed: calculateStat(baseStats.speed, ivs.speed, evs.speed, level, natureModifier.Speed)
  };
}

// 验证个体值（0-31）
export function validateIV(value: number): number {
  return Math.max(0, Math.min(31, Math.floor(value)));
}

// 验证努力值（0-252，总和不超过510）
export function validateEV(value: number): number {
  return Math.max(0, Math.min(252, Math.floor(value)));
}

// 验证努力值总和
export function validateEVTotal(evs: PokemonEVs): boolean {
  const total = evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.spDefense + evs.speed;
  return total <= 510;
}

// 获取努力值总和
export function getEVTotal(evs: PokemonEVs): number {
  return evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.spDefense + evs.speed;
}

// 创建默认个体值（全31）
export function createDefaultIVs(): PokemonIVs {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    specialAttack: 31,
    spDefense: 31,
    speed: 31
  };
}

// 创建默认努力值（全0）
export function createDefaultEVs(): PokemonEVs {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    spDefense: 0,
    speed: 0
  };
}

// 获取性格修正显示文本
export function getNatureModifierText(nature: string, stat: keyof Omit<NatureModifier, 'name'>): string {
  const modifier = natureModifiers[nature];
  if (!modifier) return '';
  
  const value = modifier[stat];
  if (value > 1.0) return '+10%';
  if (value < 1.0) return '-10%';
  return '';
}

// 获取性格修正颜色
export function getNatureModifierColor(nature: string, stat: keyof Omit<NatureModifier, 'name'>): string {
  const modifier = natureModifiers[nature];
  if (!modifier) return 'text-gray-600';
  
  const value = modifier[stat];
  if (value > 1.0) return 'text-red-600';
  if (value < 1.0) return 'text-blue-600';
  return 'text-gray-600';
}