#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'public'))

from simple_calc import PokemonDamageCalculator, Pokemon

# 测试数据
attacker_data = {
    "id": 1,
    "name": "皮卡丘",
    "types": ["Electric"],
    "base_stats": {
        "HP": 35,
        "Attack": 55,
        "Defense": 40,
        "Sp. Attack": 50,
        "Sp. Defense": 50,
        "Speed": 90
    },
    "level": 50,
    "nature": "勤奋",
    "ability": "",
    "item": "",
    "status": "",
    "weather": "",
    "screens": [],
    "assist_status": "",
    "ivs": {
        "HP": 31,
        "Attack": 31,
        "Defense": 31,
        "Sp. Attack": 31,
        "Sp. Defense": 31,
        "Speed": 31
    },
    "evs": {
        "HP": 0,
        "Attack": 0,
        "Defense": 0,
        "Sp. Attack": 252,
        "Sp. Defense": 4,
        "Speed": 252
    }
}

defender_data = {
    "id": 2,
    "name": "妙蛙种子",
    "types": ["Grass", "Poison"],
    "base_stats": {
        "HP": 45,
        "Attack": 49,
        "Defense": 49,
        "Sp. Attack": 65,
        "Sp. Defense": 65,
        "Speed": 45
    },
    "level": 50,
    "nature": "勤奋",
    "ability": "",
    "item": "",
    "status": "",
    "weather": "",
    "screens": [],
    "assist_status": "",
    "ivs": {
        "HP": 31,
        "Attack": 31,
        "Defense": 31,
        "Sp. Attack": 31,
        "Sp. Defense": 31,
        "Speed": 31
    },
    "evs": {
        "HP": 252,
        "Attack": 0,
        "Defense": 0,
        "Sp. Attack": 0,
        "Sp. Defense": 252,
        "Speed": 4
    }
}

move_data = {
    "id": 1,
    "name": "十万伏特",
    "power": 90,
    "type": "Electric",
    "category": "特殊",
    "accuracy": 100
}

print("开始测试Python版本...")

try:
    calculator = PokemonDamageCalculator()
    
    # 创建Pokemon对象
    attacker = Pokemon(**attacker_data)
    defender = Pokemon(**defender_data)
    
    result = calculator.calculate_damage_direct(
        attacker,
        defender,
        move_data,
        critical_hit=False,
        random_factor=1.0
    )
    
    print("Python计算结果:")
    print("完整结果:", result)
    if "damage" in result:
        print("最终伤害:", result["damage"])
        print("基础伤害:", result["base_damage"])
        print("修正值:", result["modifiers"])
        print("使用的道具:", result["items_used"])
        print("详细步骤:", result["calculation_steps"])
    
except Exception as e:
    print("Python计算错误:", e)
    import traceback
    traceback.print_exc()