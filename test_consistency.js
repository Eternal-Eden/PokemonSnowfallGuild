// 测试TypeScript和Python版本的一致性
import { pokemonDamageCalculator } from './dist/pokemonDamageCalculator.js';

// 测试数据
const testData = {
  attacker: {
    id: 1,
    name: "皮卡丘",
    types: ["Electric"],
    baseStats: {
      HP: 35,
      Attack: 55,
      Defense: 40,
      "Sp. Attack": 50,
      "Sp. Defense": 50,
      Speed: 90
    },
    level: 50,
    nature: "勤奋",
    ability: "",
    item: "",
    status: "",
    weather: "",
    screens: [],
    assistStatus: "",
    ivs: {
      HP: 31,
      Attack: 31,
      Defense: 31,
      "Sp. Attack": 31,
      "Sp. Defense": 31,
      Speed: 31
    },
    evs: {
      HP: 0,
      Attack: 0,
      Defense: 0,
      "Sp. Attack": 252,
      "Sp. Defense": 4,
      Speed: 252
    }
  },
  defender: {
    id: 2,
    name: "妙蛙种子",
    types: ["Grass", "Poison"],
    baseStats: {
      HP: 45,
      Attack: 49,
      Defense: 49,
      "Sp. Attack": 65,
      "Sp. Defense": 65,
      Speed: 45
    },
    level: 50,
    nature: "勤奋",
    ability: "",
    item: "",
    status: "",
    weather: "",
    screens: [],
    assistStatus: "",
    ivs: {
      HP: 31,
      Attack: 31,
      Defense: 31,
      "Sp. Attack": 31,
      "Sp. Defense": 31,
      Speed: 31
    },
    evs: {
      HP: 252,
      Attack: 0,
      Defense: 0,
      "Sp. Attack": 0,
      "Sp. Defense": 252,
      Speed: 4
    }
  },
  move: {
    id: 1,
    name: "十万伏特",
    power: 90,
    type: "Electric",
    category: "特殊",
    accuracy: 100
  },
  isCritical: false,
  randomFactor: 1.0
};

console.log("开始测试TypeScript版本...");

try {
  const result = pokemonDamageCalculator.calculateDamageDirect(
    testData.attacker,
    testData.defender,
    testData.move,
    testData.isCritical,
    testData.randomFactor
  );
  
  console.log("TypeScript计算结果:");
  console.log("最终伤害:", result.damage);
  console.log("基础伤害:", result.baseDamage);
  console.log("修正值:", result.modifiers);
  console.log("使用的道具:", result.itemsUsed);
  console.log("详细步骤:", result.calculationSteps);
} catch (error) {
  console.error("TypeScript计算错误:", error);
  console.error("错误堆栈:", error.stack);
}