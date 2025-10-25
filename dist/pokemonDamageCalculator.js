/**
 * 宝可梦伤害计算器 TypeScript 版本
 * Pokemon Damage Calculator TypeScript Version
 * 基于 simple_calc.py 的完整实现
 */
// 性格修正表 / Nature Modifiers
export const NATURE_MODIFIERS = {
    '勤奋': { name: '勤奋', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 1.0 },
    '怕寂寞': { name: '怕寂寞', HP: 1.0, Attack: 1.1, Defense: 0.9, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.1, defense: 0.9, spAttack: 1.0, spDefense: 1.0, speed: 1.0 },
    '固执': { name: '固执', HP: 1.0, Attack: 1.1, Defense: 1.0, 'Sp. Attack': 0.9, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.1, defense: 1.0, spAttack: 0.9, spDefense: 1.0, speed: 1.0 },
    '顽皮': { name: '顽皮', HP: 1.0, Attack: 1.1, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 0.9, Speed: 1.0, attack: 1.1, defense: 1.0, spAttack: 1.0, spDefense: 0.9, speed: 1.0 },
    '勇敢': { name: '勇敢', HP: 1.0, Attack: 1.1, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 0.9, attack: 1.1, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 0.9 },
    '大胆': { name: '大胆', HP: 1.0, Attack: 0.9, Defense: 1.1, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 0.9, defense: 1.1, spAttack: 1.0, spDefense: 1.0, speed: 1.0 },
    '坦率': { name: '坦率', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 1.0 },
    '悠闲': { name: '悠闲', HP: 1.0, Attack: 1.0, Defense: 1.1, 'Sp. Attack': 0.9, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 1.1, spAttack: 0.9, spDefense: 1.0, speed: 1.0 },
    '淘气': { name: '淘气', HP: 1.0, Attack: 1.0, Defense: 1.1, 'Sp. Attack': 1.0, 'Sp. Defense': 0.9, Speed: 1.0, attack: 1.0, defense: 1.1, spAttack: 1.0, spDefense: 0.9, speed: 1.0 },
    '乐天': { name: '乐天', HP: 1.0, Attack: 1.0, Defense: 1.1, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 0.9, attack: 1.0, defense: 1.1, spAttack: 1.0, spDefense: 1.0, speed: 0.9 },
    '胆小': { name: '胆小', HP: 1.0, Attack: 0.9, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.1, attack: 0.9, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 1.1 },
    '急躁': { name: '急躁', HP: 1.0, Attack: 1.0, Defense: 0.9, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.1, attack: 1.0, defense: 0.9, spAttack: 1.0, spDefense: 1.0, speed: 1.1 },
    '认真': { name: '认真', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 1.0 },
    '爽朗': { name: '爽朗', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 0.9, 'Sp. Defense': 1.0, Speed: 1.1, attack: 1.0, defense: 1.0, spAttack: 0.9, spDefense: 1.0, speed: 1.1 },
    '天真': { name: '天真', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 0.9, Speed: 1.1, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 0.9, speed: 1.1 },
    '内敛': { name: '内敛', HP: 1.0, Attack: 0.9, Defense: 1.0, 'Sp. Attack': 1.1, 'Sp. Defense': 1.0, Speed: 1.0, attack: 0.9, defense: 1.0, spAttack: 1.1, spDefense: 1.0, speed: 1.0 },
    '慢吞吞': { name: '慢吞吞', HP: 1.0, Attack: 1.0, Defense: 0.9, 'Sp. Attack': 1.1, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 0.9, spAttack: 1.1, spDefense: 1.0, speed: 1.0 },
    '冷静': { name: '冷静', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.1, 'Sp. Defense': 1.0, Speed: 0.9, attack: 1.0, defense: 1.0, spAttack: 1.1, spDefense: 1.0, speed: 0.9 },
    '温和': { name: '温和', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.1, 'Sp. Defense': 0.9, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 1.1, spDefense: 0.9, speed: 1.0 },
    '温顺': { name: '温顺', HP: 1.0, Attack: 0.9, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.1, Speed: 1.0, attack: 0.9, defense: 1.0, spAttack: 1.0, spDefense: 1.1, speed: 1.0 },
    '马虎': { name: '马虎', HP: 1.0, Attack: 1.0, Defense: 0.9, 'Sp. Attack': 1.0, 'Sp. Defense': 1.1, Speed: 1.0, attack: 1.0, defense: 0.9, spAttack: 1.0, spDefense: 1.1, speed: 1.0 },
    '慎重': { name: '慎重', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 0.9, 'Sp. Defense': 1.1, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 0.9, spDefense: 1.1, speed: 1.0 },
    '浮躁': { name: '浮躁', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.1, Speed: 0.9, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.1, speed: 0.9 },
    '沉着': { name: '沉着', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.1, Speed: 0.9, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.1, speed: 0.9 },
    '害羞': { name: '害羞', HP: 1.0, Attack: 1.0, Defense: 1.0, 'Sp. Attack': 1.0, 'Sp. Defense': 1.0, Speed: 1.0, attack: 1.0, defense: 1.0, spAttack: 1.0, spDefense: 1.0, speed: 1.0 }
};
// 属性名映射表 / Type name mapping
export const TYPE_NAME_MAPPING = {
    '一般': 'Normal',
    '格斗': 'Fighting',
    '飞行': 'Flying',
    '毒': 'Poison',
    '地面': 'Ground',
    '岩石': 'Rock',
    '虫': 'Bug',
    '幽灵': 'Ghost',
    '钢': 'Steel',
    '火': 'Fire',
    '水': 'Water',
    '草': 'Grass',
    '电': 'Electric',
    '超能力': 'Psychic',
    '冰': 'Ice',
    '龙': 'Dragon',
    '恶': 'Dark',
    '妖精': 'Fairy',
    // 英文保持不变
    'Normal': 'Normal',
    'Fighting': 'Fighting',
    'Flying': 'Flying',
    'Poison': 'Poison',
    'Ground': 'Ground',
    'Rock': 'Rock',
    'Bug': 'Bug',
    'Ghost': 'Ghost',
    'Steel': 'Steel',
    'Fire': 'Fire',
    'Water': 'Water',
    'Grass': 'Grass',
    'Electric': 'Electric',
    'Psychic': 'Psychic',
    'Ice': 'Ice',
    'Dragon': 'Dragon',
    'Dark': 'Dark',
    'Fairy': 'Fairy'
};
// ==================== 属性相克表 / Type Effectiveness Chart ====================
export const TYPE_EFFECTIVENESS = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fighting: {
        Normal: 2, Flying: 0.5, Poison: 0.5, Rock: 2, Bug: 0.5,
        Ghost: 0, Steel: 2, Psychic: 0.5, Ice: 2, Dark: 2, Fairy: 0.5
    },
    Flying: { Fighting: 2, Rock: 0.5, Bug: 2, Steel: 0.5, Grass: 2, Electric: 0.5 },
    Poison: { Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Grass: 2, Fairy: 2 },
    Ground: {
        Flying: 0, Poison: 2, Rock: 2, Bug: 0.5, Steel: 2,
        Fire: 2, Grass: 0.5, Electric: 2
    },
    Rock: { Fighting: 0.5, Flying: 2, Ground: 0.5, Bug: 2, Steel: 0.5, Fire: 2, Ice: 2 },
    Bug: {
        Fighting: 0.5, Flying: 0.5, Poison: 0.5, Ghost: 0.5, Steel: 0.5,
        Fire: 0.5, Grass: 2, Psychic: 2, Dark: 2, Fairy: 0.5
    },
    Ghost: { Normal: 0, Ghost: 2, Psychic: 2, Dark: 0.5 },
    Steel: {
        Rock: 2, Steel: 0.5, Fire: 0.5, Water: 0.5,
        Electric: 0.5, Ice: 2, Fairy: 2
    },
    Fire: {
        Rock: 0.5, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5,
        Grass: 2, Ice: 2, Dragon: 0.5
    },
    Water: { Ground: 2, Rock: 2, Fire: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
    Grass: {
        Flying: 0.5, Poison: 0.5, Ground: 2, Rock: 2, Bug: 0.5,
        Steel: 0.5, Fire: 0.5, Water: 2, Grass: 0.5, Dragon: 0.5
    },
    Electric: { Flying: 2, Ground: 0, Water: 2, Grass: 0.5, Electric: 0.5, Dragon: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Steel: 0.5, Psychic: 0.5, Dark: 0 },
    Ice: {
        Flying: 2, Ground: 2, Steel: 0.5, Fire: 0.5,
        Water: 0.5, Grass: 2, Ice: 0.5, Dragon: 2
    },
    Dragon: { Steel: 0.5, Dragon: 2, Fairy: 0 },
    Dark: { Fighting: 0.5, Ghost: 2, Psychic: 2, Dark: 0.5, Fairy: 0.5 },
    Fairy: { Fighting: 2, Poison: 0.5, Steel: 0.5, Fire: 0.5, Dragon: 2, Dark: 2 }
};
// ==================== 工具函数 / Utility Functions ====================
/**
 * 五舍六入取整函数 / Round half up function
 * @param value 要取整的数值
 * @returns 取整后的整数
 */
export function roundHalfUp(value) {
    return Math.floor(value + 0.5);
}
/**
 * 计算属性相克倍率 / Calculate type effectiveness multiplier
 * @param attackType 攻击属性
 * @param defenseTypes 防御属性数组
 * @returns 属性相克倍率
 */
export function getTypeEffectiveness(attackType, defenseTypes) {
    // 将中文属性名转换为英文
    const englishAttackType = TYPE_NAME_MAPPING[attackType] || attackType;
    if (!TYPE_EFFECTIVENESS[englishAttackType]) {
        return 1.0;
    }
    let effectiveness = 1.0;
    for (const defenseType of defenseTypes) {
        // 将中文属性名转换为英文
        const englishDefenseType = TYPE_NAME_MAPPING[defenseType] || defenseType;
        if (TYPE_EFFECTIVENESS[englishAttackType][englishDefenseType] !== undefined) {
            effectiveness *= TYPE_EFFECTIVENESS[englishAttackType][englishDefenseType];
        }
    }
    return effectiveness;
}
// ==================== 宝可梦伤害计算器类 / Pokemon Damage Calculator Class ====================
export class PokemonDamageCalculator {
    constructor() {
        this.typeEffectiveness = TYPE_EFFECTIVENESS;
    }
    /**
     * 计算宝可梦的实际能力值
     * @param pokemon 宝可梦数据
     * @returns 计算后的能力值
     */
    calculateStats(pokemon) {
        const level = pokemon.level || 50;
        const nature = pokemon.nature || '勤奋';
        const ivs = pokemon.ivs || {};
        const evs = pokemon.evs || {};
        const natureModifier = NATURE_MODIFIERS[nature] || NATURE_MODIFIERS['勤奋'];
        const stats = {
            HP: 0,
            Attack: 0,
            Defense: 0,
            'Sp. Attack': 0,
            'Sp. Defense': 0,
            Speed: 0
        };
        // HP计算公式特殊
        const hpIv = ivs.HP || 31;
        const hpEv = evs.HP || 0;
        stats.HP = Math.floor(((pokemon.baseStats.HP * 2 + hpIv + Math.floor(hpEv / 4)) * level) / 100) + level + 10;
        // 其他能力值计算
        const statNames = ['Attack', 'Defense', 'Sp. Attack', 'Sp. Defense', 'Speed'];
        for (const statName of statNames) {
            const baseStat = pokemon.baseStats[statName];
            const iv = ivs[statName] || 31;
            const ev = evs[statName] || 0;
            const natureMultiplier = natureModifier[statName];
            const statValue = Math.floor(((baseStat * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5;
            stats[statName] = Math.floor(statValue * natureMultiplier);
        }
        return stats;
    }
    /**
     * 应用攻击方道具效果
     * @param context 计算上下文
     * @returns 道具修正倍率
     */
    applyAttackerItemEffects(context) {
        const { attacker, move } = context;
        const item = attacker.item;
        if (!item)
            return 1.0;
        // 攻击力提升道具
        const attackBoostItems = {
            '力量头带': 1.1,
            '专爱头带': 1.5,
            '生命宝珠': 1.3,
            '达人带': 1.2
        };
        if (attackBoostItems[item]) {
            return attackBoostItems[item];
        }
        // 特定属性强化道具
        const typeBoostItems = {
            '木炭': ['火'],
            '神秘水滴': ['水'],
            '奇迹种子': ['草'],
            '磁铁': ['电'],
            '不融冰': ['冰'],
            '黑带': ['格斗'],
            '毒针': ['毒'],
            '柔软沙子': ['地面'],
            '尖嘴': ['飞行'],
            '扭曲汤匙': ['超能力'],
            '银粉': ['虫'],
            '硬石头': ['岩石'],
            '咒符': ['幽灵'],
            '龙牙': ['龙'],
            '黑眼镜': ['恶'],
            '金属膜': ['钢'],
            '妖精宝石': ['妖精']
        };
        for (const [itemName, types] of Object.entries(typeBoostItems)) {
            if (item === itemName && types.includes(move.type)) {
                return 1.2;
            }
        }
        // 特定宝可梦专用道具
        const pokemonSpecificItems = {
            '粗骨头': { pokemon: '卡拉卡拉', multiplier: 2.0 },
            '电气球': { pokemon: '皮卡丘', multiplier: 2.0 },
            '金属粉': { pokemon: '百变怪', multiplier: 2.0 }
        };
        if (pokemonSpecificItems[item] && pokemonSpecificItems[item].pokemon === attacker.name) {
            return pokemonSpecificItems[item].multiplier;
        }
        return 1.0;
    }
    /**
     * 应用防御方道具效果
     * @param context 计算上下文
     * @returns 道具修正倍率
     */
    applyDefenderItemEffects(context) {
        const { defender, move } = context;
        const item = defender.item;
        if (!item)
            return 1.0;
        // 伤害减少道具
        const damageReductionItems = {
            '突击背心': 0.67, // 特殊攻击减少1/3
            '进化奇石': 0.5
        };
        if (damageReductionItems[item]) {
            if (item === '突击背心' && move.category === '特殊') {
                return damageReductionItems[item];
            }
            if (item === '进化奇石') {
                return damageReductionItems[item];
            }
        }
        // 特定属性抗性道具
        const typeResistanceItems = {
            '防火服': ['火'],
            '防水服': ['水'],
            '防草服': ['草'],
            '防电服': ['电'],
            '防冰服': ['冰'],
            '防毒面具': ['毒']
        };
        for (const [itemName, types] of Object.entries(typeResistanceItems)) {
            if (item === itemName && types.includes(move.type)) {
                return 0.5;
            }
        }
        return 1.0;
    }
    /**
     * 应用攻击方特性效果
     * @param context 计算上下文
     * @returns 特性修正倍率
     */
    applyOffensiveAbilityEffects(context) {
        const { attacker, move } = context;
        const ability = attacker.ability;
        if (!ability)
            return 1.0;
        // 适应力 - 同属性攻击倍率从1.5提升到2.0
        if (ability === '适应力' && attacker.types.includes(move.type)) {
            return 2.0 / 1.5; // 额外的0.33倍率
        }
        // 技术高手 - 威力60以下的招式威力提升50%
        if (ability === '技术高手' && move.power <= 60) {
            return 1.5;
        }
        // 铁拳 - 拳类招式威力提升20%
        const punchMoves = ['音速拳', '火焰拳', '雷电拳', '冰冻拳', '爆裂拳', '吸取拳', '真气拳', '彗星拳', '子弹拳', '雷光拳'];
        if (ability === '铁拳' && punchMoves.includes(move.name)) {
            return 1.2;
        }
        // 狙击手 - 击中要害时伤害倍率从2.0提升到3.0
        if (ability === '狙击手' && context.isCritical) {
            return 3.0 / 2.0; // 额外的0.5倍率
        }
        // 胆量 - 对幽灵系宝可梦使用一般系和格斗系招式有效
        if (ability === '胆量' && (move.type === '一般' || move.type === '格斗') &&
            context.defender.types.includes('幽灵')) {
            return 1.0; // 使无效攻击变为正常效果
        }
        // HP触发特性
        const currentHPRatio = (attacker.currentHP || attacker.baseStats.HP) / attacker.baseStats.HP;
        // 猛火 - HP低于1/3时火系招式威力提升50%
        if (ability === '猛火' && currentHPRatio <= 1 / 3 && move.type === '火') {
            return 1.5;
        }
        // 激流 - HP低于1/3时水系招式威力提升50%
        if (ability === '激流' && currentHPRatio <= 1 / 3 && move.type === '水') {
            return 1.5;
        }
        // 茂盛 - HP低于1/3时草系招式威力提升50%
        if (ability === '茂盛' && currentHPRatio <= 1 / 3 && move.type === '草') {
            return 1.5;
        }
        // 虫之预感 - HP低于1/3时虫系招式威力提升50%
        if (ability === '虫之预感' && currentHPRatio <= 1 / 3 && move.type === '虫') {
            return 1.5;
        }
        return 1.0;
    }
    /**
     * 应用防御方特性效果
     * @param context 计算上下文
     * @returns 特性修正倍率和属性相克修正
     */
    applyDefensiveAbilityEffects(context) {
        const { defender, move } = context;
        const ability = defender.ability;
        if (!ability)
            return { multiplier: 1.0, typeEffectiveness: getTypeEffectiveness(move.type, defender.types) };
        let multiplier = 1.0;
        let typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
        // 厚脂肪 - 火系和冰系招式伤害减半
        if (ability === '厚脂肪' && (move.type === '火' || move.type === '冰')) {
            multiplier *= 0.5;
        }
        // 干燥皮肤 - 火系招式伤害增加25%，水系招式回复HP
        if (ability === '干燥皮肤') {
            if (move.type === '火') {
                multiplier *= 1.25;
            }
            else if (move.type === '水') {
                return { multiplier: 0, typeEffectiveness: 0 }; // 水系招式无效并回复HP
            }
        }
        // 过滤 - 超有效招式伤害减少25%
        if (ability === '过滤' && typeEffectiveness > 1.0) {
            multiplier *= 0.75;
        }
        // 避雷针 - 电系招式无效并提升特攻
        if (ability === '避雷针' && move.type === '电') {
            return { multiplier: 0, typeEffectiveness: 0 };
        }
        // 引水 - 水系招式无效并提升特攻
        if (ability === '引水' && move.type === '水') {
            return { multiplier: 0, typeEffectiveness: 0 };
        }
        // 引火 - 火系招式无效并提升火系招式威力
        if (ability === '引火' && move.type === '火') {
            return { multiplier: 0, typeEffectiveness: 0 };
        }
        // 浮游 - 地面系招式无效
        if (ability === '浮游' && move.type === '地面') {
            return { multiplier: 0, typeEffectiveness: 0 };
        }
        // 轻金属 - 重量减半（影响某些招式）
        if (ability === '轻金属') {
            // 这里可以添加重量相关招式的处理
        }
        return { multiplier, typeEffectiveness };
    }
    /**
     * 计算基础伤害
     * @param context 计算上下文
     * @returns 基础伤害值
     */
    calculateBaseDamage(context) {
        const { attacker, defender, move } = context;
        const attackerStats = this.calculateStats(attacker);
        const defenderStats = this.calculateStats(defender);
        // 确定使用的攻击和防御能力值
        let attackStat;
        let defenseStat;
        if (move.category === '物理') {
            attackStat = attackerStats.Attack;
            defenseStat = defenderStats.Defense;
        }
        else {
            attackStat = attackerStats['Sp. Attack'];
            defenseStat = defenderStats['Sp. Defense'];
        }
        // 应用灼伤状态对物理攻击的影响
        if (attacker.status === 'burn' && move.category === '物理') {
            attackStat = Math.floor(attackStat * 0.5);
        }
        // 基础伤害公式
        const level = attacker.level || 50;
        const power = move.power;
        const baseDamage = Math.floor(Math.floor(((2 * level) / 5 + 2) * power * attackStat / defenseStat) / 50) + 2;
        return baseDamage;
    }
    /**
     * 应用天气效果
     * @param damage 当前伤害值
     * @param context 计算上下文
     * @returns 应用天气效果后的伤害值
     */
    applyWeatherEffects(damage, context) {
        const { move, weather } = context;
        if (!weather)
            return damage;
        // 大晴天
        if (weather === 'sunny') {
            if (move.type === '火') {
                return Math.floor(damage * 1.5);
            }
            else if (move.type === '水') {
                return Math.floor(damage * 0.5);
            }
        }
        // 下雨
        if (weather === 'rain') {
            if (move.type === '水') {
                return Math.floor(damage * 1.5);
            }
            else if (move.type === '火') {
                return Math.floor(damage * 0.5);
            }
        }
        // 沙暴 - 岩石系宝可梦特防提升50%
        if (weather === 'sandstorm' && context.defender.types.includes('岩石') && move.category === '特殊') {
            return Math.floor(damage * 0.67);
        }
        return damage;
    }
    /**
     * 应用墙壁效果
     * @param damage 当前伤害值
     * @param context 计算上下文
     * @returns 应用墙壁效果后的伤害值
     */
    applyScreenEffects(damage, context) {
        const { move, screens } = context;
        if (!screens || screens.length === 0)
            return damage;
        // 反射壁 - 物理攻击伤害减半
        if (screens.includes('reflect') && move.category === '物理') {
            return Math.floor(damage * 0.5);
        }
        // 光墙 - 特殊攻击伤害减半
        if (screens.includes('light_screen') && move.category === '特殊') {
            return Math.floor(damage * 0.5);
        }
        return damage;
    }
    /**
     * 应用攻击方道具效果到能力值
     * @param attacker 攻击方宝可梦
     * @param stats 能力值
     * @param moveType 招式属性
     * @returns 修正后的能力值和伤害倍率
     */
    applyAttackerItemEffectsToStats(attacker, stats, moveType) {
        const item = attacker.item;
        let damageMultiplier = 1.0;
        const modifiedStats = Object.assign({}, stats);
        if (!item)
            return { stats: modifiedStats, damageMultiplier };
        // 攻击力提升道具
        const attackBoostItems = {
            '力量头带': 1.1,
            '专爱头带': 1.5,
            '生命宝珠': 1.3,
            '达人带': 1.2
        };
        if (attackBoostItems[item]) {
            damageMultiplier *= attackBoostItems[item];
        }
        // 特定属性强化道具
        const typeBoostItems = {
            '木炭': ['火'],
            '神秘水滴': ['水'],
            '奇迹种子': ['草'],
            '磁铁': ['电'],
            '不融冰': ['冰'],
            '黑带': ['格斗'],
            '毒针': ['毒'],
            '柔软沙子': ['地面'],
            '尖嘴': ['飞行'],
            '扭曲汤匙': ['超能力'],
            '银粉': ['虫'],
            '硬石头': ['岩石'],
            '咒符': ['幽灵'],
            '龙牙': ['龙'],
            '黑眼镜': ['恶'],
            '金属膜': ['钢'],
            '妖精宝石': ['妖精']
        };
        for (const [itemName, types] of Object.entries(typeBoostItems)) {
            if (item === itemName && types.includes(moveType)) {
                damageMultiplier *= 1.2;
            }
        }
        return { stats: modifiedStats, damageMultiplier };
    }
    /**
     * 应用防御方道具效果到能力值
     * @param defender 防御方宝可梦
     * @param stats 能力值
     * @returns 修正后的能力值和伤害倍率
     */
    applyDefenderItemEffectsToStats(defender, stats) {
        const item = defender.item;
        let damageMultiplier = 1.0;
        const modifiedStats = Object.assign({}, stats);
        if (!item)
            return { stats: modifiedStats, damageMultiplier };
        // 伤害减少道具
        if (item === '进化奇石') {
            damageMultiplier *= 0.5;
        }
        return { stats: modifiedStats, damageMultiplier };
    }
    /**
     * 应用攻击方特性效果（新版本）
     * @param attacker 攻击方宝可梦
     * @param move 招式
     * @param otherModifiers 其他修正值
     * @param isCritical 是否暴击
     * @returns 修正后的各种倍率
     */
    applyOffensiveAbilityEffectsNew(attacker, move, otherModifiers, isCritical) {
        const ability = attacker.ability;
        let newOtherModifiers = otherModifiers;
        let stabMultiplier = 1.0;
        let criticalMultiplier = isCritical ? 2.0 : 1.0;
        let typeMultiplier = 1.0; // 不在这里计算，由外部传入
        if (!ability) {
            // 计算STAB
            if (attacker.types.includes(move.type)) {
                stabMultiplier = 1.5;
            }
            return { otherModifiers: newOtherModifiers, stabMultiplier, criticalMultiplier, typeMultiplier };
        }
        // 适应力 - 同属性攻击倍率从1.5提升到2.0
        if (ability === '适应力' && attacker.types.includes(move.type)) {
            stabMultiplier = 2.0;
        }
        else if (attacker.types.includes(move.type)) {
            stabMultiplier = 1.5;
        }
        // 技术高手 - 威力60以下的招式威力提升50%
        if (ability === '技术高手' && move.power <= 60) {
            newOtherModifiers *= 1.5;
        }
        // 铁拳 - 拳类招式威力提升20%
        if (ability === '铁拳' && move.name.includes('拳')) {
            newOtherModifiers *= 1.2;
        }
        // 狙击手 - 击中要害时伤害倍率从2.0提升到3.0
        if (ability === '狙击手' && isCritical) {
            criticalMultiplier = 3.0;
        }
        // 无畏 - 对幽灵系使用一般系和格斗系招式时有效
        if (ability === '无畏' && typeMultiplier === 0 && (move.type === 'Normal' || move.type === 'Fighting')) {
            typeMultiplier = 1.0;
        }
        // HP触发类特性 - 猛火、激流、虫之预感、草之毛皮
        const hpTriggerMap = {
            '猛火': 'Fire',
            '激流': 'Water',
            '虫之预感': 'Bug',
            '草之毛皮': 'Grass'
        };
        if (ability in hpTriggerMap) {
            const wantType = hpTriggerMap[ability];
            if (move.type === wantType) {
                // 无条件触发（不检查当前HP）
                newOtherModifiers *= 1.5;
            }
        }
        return { otherModifiers: newOtherModifiers, stabMultiplier, criticalMultiplier, typeMultiplier };
    }
    /**
     * 应用防御方特性效果
     * @param defender 防御方宝可梦
     * @param move 招式
     * @param otherModifiers 其他修正值
     * @param typeMultiplier 属性相克倍率
     * @returns 修正后的倍率
     */
    applyDefensiveAbilityEffectsNew(defender, move, otherModifiers, typeMultiplier) {
        const ability = defender.ability;
        let newOtherModifiers = otherModifiers;
        let newTypeMultiplier = typeMultiplier; // 使用传入的属性相克倍率，不重新计算
        if (!ability) {
            return { otherModifiers: newOtherModifiers, typeMultiplier: newTypeMultiplier };
        }
        // 厚脂肪 - 火系和冰系招式伤害减半
        if (ability === '厚脂肪' && (move.type === 'Fire' || move.type === 'Ice')) {
            newOtherModifiers *= 0.5;
        }
        // 过滤 - 超有效招式伤害减少25%
        if (ability === '过滤' && newTypeMultiplier > 1.0) {
            newOtherModifiers *= 0.75;
        }
        // 免疫特性
        if ((ability === '避雷针' && move.type === 'Electric') ||
            (ability === '引水' && move.type === 'Water') ||
            (ability === '引火' && move.type === 'Fire') ||
            (ability === '浮游' && move.type === 'Ground')) {
            newTypeMultiplier = 0;
        }
        return { otherModifiers: newOtherModifiers, typeMultiplier: newTypeMultiplier };
    }
    /**
     * 计算伤害
     * @param attacker 攻击方宝可梦
     * @param defender 防御方宝可梦
     * @param move 使用的招式
     * @param isCritical 是否暴击
     * @param randomFactor 随机因子 (0.85-1.0)
     * @returns 伤害计算结果
     */
    calculateDamageDirect(attacker, defender, move, isCritical = false, randomFactor = 1.0) {
        // 1. 计算攻击方和防御方的能力值
        const attackerStats = this.calculateStats(attacker);
        const defenderStats = this.calculateStats(defender);
        // 2. 应用道具效果到能力值
        const attackerItemResult = this.applyAttackerItemEffectsToStats(attacker, attackerStats, move.type);
        const defenderItemResult = this.applyDefenderItemEffectsToStats(defender, defenderStats);
        // 3. 根据招式类别确定攻击和防御数值
        let attackStat = move.category === '物理' ? attackerItemResult.stats.Attack : attackerItemResult.stats['Sp. Attack'];
        let defenseStat = move.category === '物理' ? defenderItemResult.stats.Defense : defenderItemResult.stats['Sp. Defense'];
        // 4. 应用墙壁效果到防御数值（不是伤害）
        if (defender.screens && defender.screens.length > 0) {
            if (move.category === '物理' && defender.screens.includes('reflect')) {
                defenseStat = Math.floor(defenseStat * 1.5);
            }
            else if (move.category === '特殊' && defender.screens.includes('light_screen')) {
                defenseStat = Math.floor(defenseStat * 1.5);
            }
        }
        // 5. 防止除零错误
        if (defenseStat <= 0) {
            defenseStat = 1;
        }
        // 6. 计算基础伤害
        const level = attacker.level || 50;
        const power = move.power;
        const baseDamage = Math.floor(Math.floor(((2 * level) / 5 + 2) * power * attackStat / defenseStat) / 50) + 2;
        // 7. 初始化 other_modifiers = 1.0
        let otherModifiers = 1.0;
        // 8. 应用灼烧状态（物理攻击减半，毅力特性例外）
        if (attacker.status === 'burn' && move.category === '物理' && attacker.ability !== '毅力') {
            otherModifiers *= 0.5;
        }
        // 9. 应用天气效果（以攻击方/防守方任一方的 weather 字段为准）
        const weather = attacker.weather || defender.weather || "";
        if (weather === 'sunny' && move.type === 'Fire') {
            otherModifiers *= 1.5;
        }
        else if (weather === 'sunny' && move.type === 'Water') {
            otherModifiers *= 0.5;
        }
        else if (weather === 'rain' && move.type === 'Water') {
            otherModifiers *= 1.5;
        }
        else if (weather === 'rain' && move.type === 'Fire') {
            otherModifiers *= 0.5;
        }
        // 10. 应用帮助状态
        if (attacker.assistStatus === 'help') {
            otherModifiers *= 1.5;
        }
        // 11. 计算属性相克倍率（在道具效果之后，特性效果之前）
        let typeMultiplier = getTypeEffectiveness(move.type, defender.types);
        // 12. 应用道具伤害倍率
        otherModifiers *= attackerItemResult.damageMultiplier;
        otherModifiers *= defenderItemResult.damageMultiplier;
        // 13. 应用攻击方特性效果
        const offensiveAbilityResult = this.applyOffensiveAbilityEffectsNew(attacker, move, otherModifiers, isCritical);
        otherModifiers = offensiveAbilityResult.otherModifiers;
        let stabMultiplier = offensiveAbilityResult.stabMultiplier;
        let criticalMultiplier = offensiveAbilityResult.criticalMultiplier;
        // 如果攻击方特性修改了属性相克（如无畏），使用修改后的值
        if (offensiveAbilityResult.typeMultiplier !== 1.0) {
            typeMultiplier = offensiveAbilityResult.typeMultiplier;
        }
        // 14. 应用防御方特性效果
        const defensiveAbilityResult = this.applyDefensiveAbilityEffectsNew(defender, move, otherModifiers, typeMultiplier);
        otherModifiers = defensiveAbilityResult.otherModifiers;
        typeMultiplier = defensiveAbilityResult.typeMultiplier;
        // 15. 计算最终伤害 - 严格按照Python版本的步骤
        // 先计算所有浮点数步骤
        const floatStep1 = otherModifiers * criticalMultiplier; // 其他修正 * 要害
        const floatStep2 = floatStep1 * randomFactor; // * 随机数
        const floatStep3 = floatStep2 * stabMultiplier; // * STAB
        const floatStep4 = floatStep3 * typeMultiplier; // * 属性相克
        // 最终修正因子（向下取整，最小值为1）
        const finalModifier = Math.max(1, Math.floor(floatStep4));
        // 显示用的中间结果（五舍六入）
        const step1Result = roundHalfUp(floatStep1);
        const step2Result = roundHalfUp(floatStep2);
        const step3Result = roundHalfUp(floatStep3);
        const step4Type = finalModifier;
        // 最终伤害
        const finalDamage = baseDamage * finalModifier;
        return {
            damage: finalDamage,
            baseDamage,
            modifiers: {
                otherModifiers,
                criticalMultiplier,
                randomFactor,
                stabMultiplier,
                typeMultiplier,
                finalModifier,
                attackerItemMultiplier: attackerItemResult.damageMultiplier,
                defenderItemMultiplier: defenderItemResult.damageMultiplier
            },
            calculationSteps: {
                step1OtherCritical: step1Result,
                step2Random: step2Result,
                step3Stab: step3Result,
                step4Type: step4Type
            },
            statsUsed: {
                attackStat,
                defenseStat
            },
            itemsUsed: {
                attackerItem: attacker.item || '无',
                defenderItem: defender.item || '无'
            }
        };
    }
    /**
     * 从JSON数据计算伤害
     * @param jsonData JSON格式的计算数据
     * @returns 伤害计算结果
     */
    calculateDamageFromJson(jsonData) {
        const attacker = jsonData.attacker;
        const defender = jsonData.defender;
        const move = jsonData.move;
        const isCritical = jsonData.is_critical || false;
        const randomFactor = jsonData.random_factor || 1.0;
        return this.calculateDamageDirect(attacker, defender, move, isCritical, randomFactor);
    }
    /**
     * 计算伤害区间
     * @param attacker 攻击方宝可梦
     * @param defender 防御方宝可梦
     * @param move 使用的招式
     * @param isCritical 是否暴击
     * @returns 伤害区间数组
     */
    calculateDamageRange(attacker, defender, move, isCritical = false) {
        const damageRange = [];
        // 随机因子从85%到100%，共16个值
        for (let i = 85; i <= 100; i++) {
            const randomFactor = i / 100;
            const result = this.calculateDamageDirect(attacker, defender, move, isCritical, randomFactor);
            damageRange.push(result.damage);
        }
        return damageRange;
    }
    /**
     * 获取伤害统计信息
     * @param attacker 攻击方宝可梦
     * @param defender 防御方宝可梦
     * @param move 使用的招式
     * @param isCritical 是否暴击
     * @returns 伤害统计信息
     */
    getDamageStatistics(attacker, defender, move, isCritical = false) {
        const damageRange = this.calculateDamageRange(attacker, defender, move, isCritical);
        const defenderStats = this.calculateStats(defender);
        const defenderHP = defenderStats.HP;
        const minDamage = Math.min(...damageRange);
        const maxDamage = Math.max(...damageRange);
        const averageDamage = Math.round(damageRange.reduce((sum, damage) => sum + damage, 0) / damageRange.length);
        // 计算一击必杀概率
        const ohkoCount = damageRange.filter(damage => damage >= defenderHP).length;
        const ohkoChance = (ohkoCount / damageRange.length) * 100;
        // 计算二击必杀概率
        const twoHkoCount = damageRange.filter(damage => damage >= defenderHP / 2).length;
        const twoHkoChance = (twoHkoCount / damageRange.length) * 100;
        return {
            minDamage,
            maxDamage,
            averageDamage,
            damageRange,
            ohkoChance,
            twoHkoChance
        };
    }
    /**
     * 获取攻击方道具名称
     * @param attacker 攻击方宝可梦
     * @returns 道具名称
     */
    getAttackerItemName(attacker) {
        return attacker.item || '无道具';
    }
    /**
     * 获取防御方道具名称
     * @param defender 防御方宝可梦
     * @returns 道具名称
     */
    getDefenderItemName(defender) {
        return defender.item || '无道具';
    }
}
// ==================== 导出默认实例 / Export Default Instance ====================
export const pokemonDamageCalculator = new PokemonDamageCalculator();
export default pokemonDamageCalculator;
