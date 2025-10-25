#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'public'))

from simple_calc import PokemonDamageCalculator

# 测试属性相克计算
calculator = PokemonDamageCalculator()

# 测试Electric对Grass+Poison的效果
attack_type = "Electric"
defense_types = ["Grass", "Poison"]

print(f"攻击属性: {attack_type}")
print(f"防守属性: {defense_types}")

effectiveness = calculator.get_type_effectiveness(attack_type, defense_types)
print(f"属性相克倍率: {effectiveness}")

# 分别测试单个属性
for defense_type in defense_types:
    single_effectiveness = calculator.get_type_effectiveness(attack_type, [defense_type])
    print(f"{attack_type} vs {defense_type}: {single_effectiveness}")