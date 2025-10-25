/**
 * 伤害计算数据生成脚本
 * Damage Calculation Data Generation Script
 */

import {
  pokemonDamageCalculator,
  getTypeEffectiveness,
  Pokemon,
  Move,
  Stats
} from '../lib/pokemonDamageCalculator';

// 基于模板的数据 / Meowth data from template
const meowthBaseStats: Stats = {
  HP: 40,
  Attack: 45,
  Defense: 35,
  'Sp. Attack': 40,
  'Sp. Defense': 40,
  Speed: 90
};

const meowthTemplate: Pokemon = {
  id: 52,
  name: '喵喵',
  types: ['Normal'],
  baseStats: meowthBaseStats,
  level: 50,
  nature: '急躁', // Hasty: +Speed, -Defense
  ability: '技术高手', // Technician
  item: '属性宝石',
  ivs: {
    HP: 31,
    Attack: 31,
    Defense: 31,
    'Sp. Attack': 31,
    'Sp. Defense': 31,
    Speed: 31
  },
  evs: {
    HP: 52,
    Attack: 60,
    Defense: 80,
    'Sp. Attack': 64,
    'Sp. Defense': 76,
    Speed: 176
  }
};

// 测试用防守方宝可梦 / Test defender Pokemon
const testDefender: Pokemon = {
  id: 1,
  name: '妙蛙种子',
  types: ['Grass', 'Poison'],
  baseStats: {
    HP: 45,
    Attack: 49,
    Defense: 49,
    'Sp. Attack': 65,
    'Sp. Defense': 65,
    Speed: 45
  },
  level: 50,
  nature: '勤奋', // Hardy: no modifiers
  ability: '茂盛',
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

// 测试招式 / Test moves
const testMoves = {
  scratch: {
    id: 1,
    name: '利爪',
    power: 40,
    type: 'Normal',
    category: '物理' as const,
    accuracy: 100
  },
  furySwipes: {
    id: 2,
    name: '连续拳',
    power: 18,
    type: 'Normal',
    category: '物理' as const,
    accuracy: 80
  },
  bodySlam: {
    id: 3,
    name: '泰山压顶',
    power: 85,
    type: 'Normal',
    category: '物理' as const,
    accuracy: 100
  },
  fly: {
    id: 4,
    name: '飞翔',
    power: 90,
    type: 'Flying',
    category: '物理' as const,
    accuracy: 95
  }
};

function generateDamageReport() {
  console.log('='.repeat(80));
  console.log('宝可梦伤害计算器详细数据报告');
  console.log('Pokemon Damage Calculator Detailed Data Report');
  console.log('='.repeat(80));
  console.log();

  // 计算喵喵的实际能力值
  const meowthStats = pokemonDamageCalculator.calculateStats(meowthTemplate);
  const defenderStats = pokemonDamageCalculator.calculateStats(testDefender);

  console.log('【攻击方数据 / Attacker Data】');
  console.log(`宝可梦: ${meowthTemplate.name} (${meowthTemplate.types.join('/')})`);
  console.log(`等级: ${meowthTemplate.level}`);
  console.log(`性格: ${meowthTemplate.nature}`);
  console.log(`特性: ${meowthTemplate.ability}`);
  console.log(`道具: ${meowthTemplate.item}`);
  console.log();
  
  console.log('基础能力值 / Base Stats:');
  Object.entries(meowthTemplate.baseStats).forEach(([stat, value]) => {
    console.log(`  ${stat}: ${value}`);
  });
  console.log();

  console.log('个体值 / IVs:');
  Object.entries(meowthTemplate.ivs || {}).forEach(([stat, value]) => {
    console.log(`  ${stat}: ${value}`);
  });
  console.log();

  console.log('努力值 / EVs:');
  Object.entries(meowthTemplate.evs || {}).forEach(([stat, value]) => {
    console.log(`  ${stat}: ${value}`);
  });
  console.log();

  console.log('实际能力值 / Actual Stats:');
  Object.entries(meowthStats).forEach(([stat, value]) => {
    console.log(`  ${stat}: ${value}`);
  });
  console.log();

  console.log('【防守方数据 / Defender Data】');
  console.log(`宝可梦: ${testDefender.name} (${testDefender.types.join('/')})`);
  console.log(`等级: ${testDefender.level}`);
  console.log(`性格: ${testDefender.nature}`);
  console.log(`特性: ${testDefender.ability}`);
  console.log();

  console.log('实际能力值 / Actual Stats:');
  Object.entries(defenderStats).forEach(([stat, value]) => {
    console.log(`  ${stat}: ${value}`);
  });
  console.log();

  console.log('='.repeat(80));
  console.log('【伤害计算详细数据 / Detailed Damage Calculation Data】');
  console.log('='.repeat(80));
  console.log();

  // 对每个招式进行详细计算
  Object.entries(testMoves).forEach(([key, move]) => {
    console.log(`招式: ${move.name} (${move.type}系, 威力${move.power})`);
    console.log('-'.repeat(60));

    // 属性相克计算
    const typeEffectiveness = getTypeEffectiveness(move.type, testDefender.types);
    console.log(`属性相克倍率: ${typeEffectiveness}x`);
    
    // 普通伤害计算
    const normalDamage = pokemonDamageCalculator.calculateDamageDirect(meowthTemplate, testDefender, move, false, 1.0);
    console.log();
    console.log('普通伤害 / Normal Damage:');
    console.log(`  最终伤害: ${normalDamage.damage}`);
    console.log(`  基础伤害: ${normalDamage.baseDamage}`);
    console.log();
    
    console.log('修正值详情 / Modifier Details:');
    console.log(`  其他修正: ${normalDamage.modifiers.otherModifiers}x`);
    console.log(`  暴击倍率: ${normalDamage.modifiers.criticalMultiplier}x`);
    console.log(`  随机因子: ${normalDamage.modifiers.randomFactor}x`);
    console.log(`  本系加成: ${normalDamage.modifiers.stabMultiplier}x`);
    console.log(`  属性相克: ${normalDamage.modifiers.typeMultiplier}x`);
    console.log(`  最终修正: ${normalDamage.modifiers.finalModifier}x`);
    console.log(`  攻击方道具: ${normalDamage.modifiers.attackerItemMultiplier}x`);
    console.log(`  防守方道具: ${normalDamage.modifiers.defenderItemMultiplier}x`);
    console.log();

    console.log('计算步骤 / Calculation Steps:');
    console.log(`  步骤1 (其他修正×暴击): ${normalDamage.calculationSteps.step1OtherCritical}`);
    console.log(`  步骤2 (×随机因子): ${normalDamage.calculationSteps.step2Random}`);
    console.log(`  步骤3 (×本系加成): ${normalDamage.calculationSteps.step3Stab}`);
    console.log(`  步骤4 (×属性相克): ${normalDamage.calculationSteps.step4Type}`);
    console.log();

    console.log('使用的能力值 / Stats Used:');
    console.log(`  攻击力: ${normalDamage.statsUsed.attackStat}`);
    console.log(`  防御力: ${normalDamage.statsUsed.defenseStat}`);
    console.log();

    // 暴击伤害计算
    const criticalDamage = pokemonDamageCalculator.calculateDamageDirect(meowthTemplate, testDefender, move, true, 1.0);
    console.log('暴击伤害 / Critical Hit Damage:');
    console.log(`  最终伤害: ${criticalDamage.damage}`);
    console.log(`  暴击倍率: ${criticalDamage.modifiers.criticalMultiplier}x`);
    console.log();

    // 技术高手特性效果验证
    if (meowthTemplate.ability === '技术高手' && move.power <= 60) {
      console.log('【技术高手特性效果 / Technician Ability Effect】');
      console.log(`威力 ${move.power} ≤ 60，触发技术高手特性`);
      console.log(`实际威力: ${move.power} × 1.5 = ${move.power * 1.5}`);
      console.log('此效果已包含在"其他修正"中');
    } else if (meowthTemplate.ability === '技术高手') {
      console.log('【技术高手特性效果 / Technician Ability Effect】');
      console.log(`威力 ${move.power} > 60，不触发技术高手特性`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log();
  });

  console.log('【特殊情况测试 / Special Case Tests】');
  console.log('-'.repeat(60));
  
  // 测试飞行系对草系的属性相克
  console.log('属性相克测试:');
  console.log(`飞行系 vs 草系: ${getTypeEffectiveness('Flying', ['Grass'])}x (效果拔群)`);
  console.log(`一般系 vs 草/毒系: ${getTypeEffectiveness('Normal', ['Grass', 'Poison'])}x (普通效果)`);
  console.log();

  console.log('技术高手特性触发条件:');
  console.log('- 利爪 (威力40): 触发 ✓');
  console.log('- 连续拳 (威力18): 触发 ✓');
  console.log('- 泰山压顶 (威力85): 不触发 ✗');
  console.log('- 飞翔 (威力90): 不触发 ✗');
  console.log();

  console.log('性格效果 (急躁):');
  console.log('- 速度: +10%');
  console.log('- 防御: -10%');
  console.log();

  console.log('报告生成完成！');
  console.log('Report generation completed!');
}

// 运行报告生成
generateDamageReport();