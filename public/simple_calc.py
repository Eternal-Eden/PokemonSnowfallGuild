#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
宝可梦伤害计算器 - Python 后端版本
Pokemon Damage Calculator - Python Backend Version

支持两种使用方式：
1. 直接运行脚本 (python simple_calc.py) - 使用内置示例数据
2. JSON 接口模式 (python simple_calc.py --json) - 从标准输入读取 JSON 参数

JSON 接口格式：
{
  "attacker": {
    "id": 25,
    "name": "皮卡丘",
    "types": ["Electric"],
    "base_stats": {"HP": 35, "Attack": 55, "Defense": 40, "Sp. Attack": 50, "Sp. Defense": 50, "Speed": 90},
    "level": 50,
    "nature": "固执",
    "ability": "静电",
    "item": "电气球",
    "status": "",
    "weather": "sunny",
    "screens": [],
    "assist_status": "",
    "ivs": {"HP": 31, "Attack": 31, "Defense": 31, "Sp. Attack": 31, "Sp. Defense": 31, "Speed": 31},
    "evs": {"HP": 0, "Attack": 252, "Defense": 0, "Sp. Attack": 252, "Sp. Defense": 0, "Speed": 6}
  },
  "defender": {
    "id": 1,
    "name": "妙蛙种子",
    "types": ["Grass", "Poison"],
    "base_stats": {"HP": 45, "Attack": 49, "Defense": 49, "Sp. Attack": 65, "Sp. Defense": 65, "Speed": 45},
    "level": 50,
    "nature": "勤奋",
    "ability": "",
    "item": "",
    "status": "",
    "weather": "sunny",
    "screens": [],
    "assist_status": "",
    "ivs": {"HP": 31, "Attack": 31, "Defense": 31, "Sp. Attack": 31, "Sp. Defense": 31, "Speed": 31},
    "evs": {"HP": 252, "Attack": 0, "Defense": 0, "Sp. Attack": 0, "Sp. Defense": 252, "Speed": 6}
  },
  "move": {
    "id": 85,
    "name": "十万伏特",
    "power": 90,
    "type": "Electric",
    "category": "特殊",
    "accuracy": 100
  },
  "critical_hit": false,
  "random_factor": null
}

返回格式：
{
  "damage": 123,
  "base_damage": 45,
  "modifiers": {
    "other_modifiers": 1.5,
    "critical_multiplier": 1.0,
    "random_factor": 0.92,
    "stab_multiplier": 1.5,
    "type_multiplier": 2.0,
    "final_modifier": 4,
    "attacker_item_multiplier": 2.0,
    "defender_item_multiplier": 1.0
  },
  "calculation_steps": {
    "step1_other_critical": 2,
    "step2_random": 2,
    "step3_stab": 3,
    "step4_type": 4
  },
  "stats_used": {
    "attack_stat": 150,
    "defense_stat": 80
  },
  "items_used": {
    "attacker_item": "电气球",
    "defender_item": "无"
  }
}
"""

import yaml
import json
import math
import random
import os
import sys
import argparse
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass


@dataclass
class Pokemon:
    """宝可梦 数据结构"""
    id: int
    name: str
    types: List[str]
    base_stats: Dict[str, int]
    level: int = 50
    nature: str = "勤奋"
    ability: str = ""
    item: str = ""
    status: str = ""  # 灼烧、冰冻等状态
    weather: str = ""  # 天气: sunny, rain, sandstorm, hail
    screens: List[str] = None  # 墙壁: reflect, light_screen
    assist_status: str = ""  # 辅助状态: help 等
    # 个体值 (IVs) - 0-31
    ivs: Dict[str, int] = None
    # 努力值 (EVs) - 每项 0-252, 总和上限 510
    evs: Dict[str, int] = None
    
    def __post_init__(self):
        if self.screens is None:
            self.screens = []
        if self.ivs is None:
            # 默认满个体值 (31)
            self.ivs = {"HP": 31, "Attack": 31, "Defense": 31, "Sp. Attack": 31, "Sp. Defense": 31, "Speed": 31}
        if self.evs is None:
            # 默认无努力值
            self.evs = {"HP": 0, "Attack": 0, "Defense": 0, "Sp. Attack": 0, "Sp. Defense": 0, "Speed": 0}


@dataclass
class Move:
    """招式 数据结构"""
    id: int
    name: str
    power: int
    type: str
    category: str  # 物理 或 特殊
    accuracy: int


class PokemonDamageCalculator:
    """宝可梦伤害计算器 类"""
    
    def __init__(self, load_data_files=True):
        self.moves_data = {}
        self.pokemon_data = {}
        self.natures_data = {}
        self.type_effectiveness = {}
        
        # 道具从 YAML 加载，先初始化为空
        self.attacker_items = {}
        self.defender_items = {}
        
        # 加载所有数据文件
        if load_data_files:
            self._load_data()
        self._setup_type_effectiveness()
    
    def _load_data(self):
        """加载 YAML/JSON 数据文件"""
        try:
            # 加载招式数据
            with open('moves.yaml', 'r', encoding='utf-8') as f:
                moves_list = yaml.safe_load(f)
                for move in moves_list:
                    self.moves_data[move['id']] = {
                        'name': move['cname'],
                        'power': move.get('power', 0) if move.get('power') is not None else 0,
                        'type': move['type'],
                        'category': move['category'],
                        'accuracy': move.get('accuracy', 0) if move.get('accuracy') is not None else 0
                    }
            
            # 加载宝可梦图鉴数据
            with open('pokedex.yaml', 'r', encoding='utf-8') as f:
                pokemon_list = yaml.safe_load(f)
                for pokemon in pokemon_list:
                    self.pokemon_data[pokemon['id']] = {
                        'name': pokemon['name']['chinese'],
                        'types': pokemon['type'],
                        'base_stats': pokemon['base'],
                        'evolution_stage': pokemon.get('evolution_stage', 'unknown')
                    }
            
            # 加载性格数据
            with open('pokemon_natures.yaml', 'r', encoding='utf-8') as f:
                natures_data = yaml.safe_load(f)
                for nature in natures_data['natures']:
                    self.natures_data[nature['name']] = {
                        'HP': nature['HP'],
                        'Attack': nature['Attack'],
                        'Defense': nature['Defense'],
                        'Sp. Attack': nature['Sp_Attack'],  # 将 Sp_Attack 转为 Sp. Attack
                        'Sp. Defense': nature['Sp_Defense'],  # 将 Sp_Defense 转为 Sp. Defense
                        'Speed': nature['Speed']
                    }
            
            # 从 items_custom.yaml 加载道具定义（不回退到其他文件）
            items_file = 'items_custom.yaml'
            try:
                with open(items_file, 'r', encoding='utf-8') as f:
                    items_loaded = yaml.safe_load(f) or {}
                    self.attacker_items = items_loaded.get('attacker_items', {})
                    self.defender_items = items_loaded.get('defender_items', {})
            except Exception:
                self.attacker_items = {}
                self.defender_items = {}
            
            # 从 YAML 加载进攻/防守特性（若存在）
            try:
                with open('进攻特性.yaml', 'r', encoding='utf-8') as f:
                    off = yaml.safe_load(f) or {}
                    # 原始映射: 名称 -> 属性字典
                    self.offensive_abilities = off.get('进攻特性', {}) if isinstance(off, dict) else {}
            except Exception:
                self.offensive_abilities = {}
            
            try:
                with open('防守特性.yaml', 'r', encoding='utf-8') as f:
                    de = yaml.safe_load(f) or {}
                    self.defensive_abilities = de.get('防守特性', {}) if isinstance(de, dict) else {}
            except Exception:
                self.defensive_abilities = {}
            
            print("Data loaded successfully!")
            
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def _setup_type_effectiveness(self):
        """设置属性相克表"""
        # 属性相克矩阵 (攻击属性 -> 防守属性 -> 倍率)
        self.type_effectiveness = {
            'Normal': {'Rock': 0.5, 'Ghost': 0, 'Steel': 0.5},
            'Fighting': {'Normal': 2, 'Flying': 0.5, 'Poison': 0.5, 'Rock': 2, 'Bug': 0.5, 'Ghost': 0, 'Steel': 2, 'Psychic': 0.5, 'Ice': 2, 'Dark': 2, 'Fairy': 0.5},
            'Flying': {'Fighting': 2, 'Rock': 0.5, 'Bug': 2, 'Steel': 0.5, 'Grass': 2, 'Electric': 0.5},
            'Poison': {'Poison': 0.5, 'Ground': 0.5, 'Rock': 0.5, 'Ghost': 0.5, 'Steel': 0, 'Grass': 2, 'Fairy': 2},
            'Ground': {'Flying': 0, 'Poison': 2, 'Rock': 2, 'Bug': 0.5, 'Steel': 2, 'Fire': 2, 'Grass': 0.5, 'Electric': 2},
            'Rock': {'Fighting': 0.5, 'Flying': 2, 'Ground': 0.5, 'Bug': 2, 'Steel': 0.5, 'Fire': 2, 'Ice': 2},
            'Bug': {'Fighting': 0.5, 'Flying': 0.5, 'Poison': 0.5, 'Ghost': 0.5, 'Steel': 0.5, 'Fire': 0.5, 'Grass': 2, 'Psychic': 2, 'Dark': 2, 'Fairy': 0.5},
            'Ghost': {'Normal': 0, 'Ghost': 2, 'Psychic': 2, 'Dark': 0.5},
            'Steel': {'Rock': 2, 'Steel': 0.5, 'Fire': 0.5, 'Water': 0.5, 'Electric': 0.5, 'Ice': 2, 'Fairy': 2},
            'Fire': {'Rock': 0.5, 'Bug': 2, 'Steel': 2, 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 2, 'Dragon': 0.5},
            'Water': {'Ground': 2, 'Rock': 2, 'Fire': 2, 'Water': 0.5, 'Grass': 0.5, 'Dragon': 0.5},
            'Grass': {'Flying': 0.5, 'Poison': 0.5, 'Ground': 2, 'Rock': 2, 'Bug': 0.5, 'Steel': 0.5, 'Fire': 0.5, 'Water': 2, 'Grass': 0.5, 'Dragon': 0.5},
            'Electric': {'Flying': 2, 'Ground': 0, 'Water': 2, 'Grass': 0.5, 'Electric': 0.5, 'Dragon': 0.5},
            'Psychic': {'Fighting': 2, 'Poison': 2, 'Steel': 0.5, 'Psychic': 0.5, 'Dark': 0},
            'Ice': {'Flying': 2, 'Ground': 2, 'Steel': 0.5, 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 0.5, 'Dragon': 2},
            'Dragon': {'Steel': 0.5, 'Dragon': 2, 'Fairy': 0},
            'Dark': {'Fighting': 0.5, 'Ghost': 2, 'Psychic': 2, 'Dark': 0.5, 'Fairy': 0.5},
            'Fairy': {'Fighting': 2, 'Poison': 0.5, 'Steel': 0.5, 'Fire': 0.5, 'Dragon': 2, 'Dark': 2}
        }
    
    def get_type_effectiveness(self, attack_type: str, defense_types: List[str]) -> float:
        """计算属性相克倍率"""
        if attack_type not in self.type_effectiveness:
            return 1.0
        
        effectiveness = 1.0
        for defense_type in defense_types:
            if defense_type in self.type_effectiveness[attack_type]:
                effectiveness *= self.type_effectiveness[attack_type][defense_type]
            else:
                effectiveness *= 1.0
        
        # 处理双重抗性/弱点
        if effectiveness == 0.25:
            return 0.25
        elif effectiveness == 4.0:
            return 4.0
        elif effectiveness == 0.5:
            return 0.5
        elif effectiveness == 2.0:
            return 2.0
        else:
            return 1.0
    
    def calculate_stats(self, pokemon: Pokemon) -> Dict[str, int]:
        """根据基础值、等级、性格、IV/EV 计算实际能力值"""
        stats = {}
        
        for stat_name, base_value in pokemon.base_stats.items():
            iv = pokemon.ivs.get(stat_name, 31)  # 默认 31
            ev = pokemon.evs.get(stat_name, 0)   # 默认 0
            
            if stat_name == 'HP':
                # HP 计算公式: ((Base * 2 + IV + EV/4) * Level / 100) + Level + 10
                stats[stat_name] = int(((base_value * 2 + iv + ev // 4) * pokemon.level // 100) + pokemon.level + 10)
            else:
                # 其它能力值: ((Base * 2 + IV + EV/4) * Level / 100) + 5
                base_stat = int(((base_value * 2 + iv + ev // 4) * pokemon.level // 100) + 5)
                
                # 应用性格倍率
                nature_multiplier = 1.0
                if pokemon.nature in self.natures_data:
                    nature_multiplier = self.natures_data[pokemon.nature].get(stat_name, 1.0)
                
                stats[stat_name] = int(base_stat * nature_multiplier)
        
        return stats
    
    def _round_half_up(self, value: float) -> int:
        """正数的五舍六入 (round half up)"""
        return int(math.floor(value + 0.5))

    def calculate_damage_from_json(self, json_data: Dict) -> Dict[str, Union[int, float]]:
        """
        从 JSON 数据计算伤害 - 用于前端接口
        """
        try:
            # 解析 JSON 数据
            attacker_data = json_data['attacker']
            defender_data = json_data['defender']
            move_data = json_data['move']
            critical_hit = json_data.get('critical_hit', False)
            random_factor = json_data.get('random_factor', None)
            
            # 创建 Pokemon 对象
            attacker = Pokemon(
                id=attacker_data['id'],
                name=attacker_data['name'],
                types=attacker_data['types'],
                base_stats=attacker_data['base_stats'],
                level=attacker_data.get('level', 50),
                nature=attacker_data.get('nature', '勤奋'),
                ability=attacker_data.get('ability', ''),
                item=attacker_data.get('item', ''),
                status=attacker_data.get('status', ''),
                weather=attacker_data.get('weather', ''),
                screens=attacker_data.get('screens', []),
                assist_status=attacker_data.get('assist_status', ''),
                ivs=attacker_data.get('ivs', {}),
                evs=attacker_data.get('evs', {})
            )
            
            defender = Pokemon(
                id=defender_data['id'],
                name=defender_data['name'],
                types=defender_data['types'],
                base_stats=defender_data['base_stats'],
                level=defender_data.get('level', 50),
                nature=defender_data.get('nature', '勤奋'),
                ability=defender_data.get('ability', ''),
                item=defender_data.get('item', ''),
                status=defender_data.get('status', ''),
                weather=defender_data.get('weather', ''),
                screens=defender_data.get('screens', []),
                assist_status=defender_data.get('assist_status', ''),
                ivs=defender_data.get('ivs', {}),
                evs=defender_data.get('evs', {})
            )
            
            # 直接使用传入的招式数据
            move = move_data
            
            # 计算伤害
            return self.calculate_damage_direct(attacker, defender, move, critical_hit, random_factor)
            
        except Exception as e:
            return {'error': f'JSON parsing error: {str(e)}'}

    def calculate_damage_direct(self, attacker: Pokemon, defender: Pokemon, move: Dict, 
                               critical_hit: bool = False, random_factor: float = None) -> Dict[str, Union[int, float]]:
        """
        直接使用传入的招式数据计算伤害 - 不依赖本地数据文件
        """
        try:
            # 计算能力值（道具可能会修改数值，稍后再应用）
            attacker_stats = self.calculate_stats(attacker)
            defender_stats = self.calculate_stats(defender)

            # 应用进攻/防守道具效果（可能修改数值或返回伤害倍率）
            type_multiplier = self.get_type_effectiveness(move['type'], defender.types)
            attacker_item_result = self.apply_attacker_item_effects(attacker, attacker_stats, move['type'], type_multiplier)
            attacker_stats = attacker_item_result['stats']
            attacker_damage_multiplier = attacker_item_result['damage_multiplier']

            defender_item_result = self.apply_defender_item_effects(defender, defender_stats)
            defender_stats = defender_item_result['stats']
            defender_damage_multiplier = defender_item_result['damage_multiplier']

            # 根据招式分类选择使用的攻防数值
            if move['category'] == '物理':
                attack_stat = attacker_stats.get('Attack', 1)
                defense_stat = defender_stats.get('Defense', 1)
            else:
                attack_stat = attacker_stats.get('Sp. Attack', 1)
                defense_stat = defender_stats.get('Sp. Defense', 1)

            # 对防守方的墙壁效果应用到防御数值（若存在）
            # reflect 影响物防，light_screen 影响特防
            if defender.screens:
                if 'reflect' in defender.screens and move['category'] == '物理':
                    defense_stat = int(defense_stat * 1.5)
                if 'light_screen' in defender.screens and move['category'] != '物理':
                    defense_stat = int(defense_stat * 1.5)

            # 防止除以零
            if defense_stat <= 0:
                defense_stat = 1

            # 基础伤害部分（按常见整数运算）
            level = attacker.level
            power = move.get('power', 0)
            # 确保power不为None，如果为None则设为0
            if power is None:
                power = 0
            base_numerator = ((2 * level) // 5 + 2) * power * attack_stat
            base_div = base_numerator // defense_stat
            base_damage = base_div // 50 + 2  # 这是乘以修正前的基础伤害

            # ------ 处理能力（特性）/状态/天气/道具 等对其他修正的影响 ------
            other_modifiers = 1.0

            # 灼烧会使物理攻击减半（毅力/ Guts 特性例外在特性处理中处理）
            if attacker.status == 'burn' and move['category'] == '物理' and attacker.ability != '毅力':
                other_modifiers *= 0.5

            # 天气影响（以攻击方/防守方任一方的 weather 字段为准）
            weather = attacker.weather or defender.weather or ""
            if weather == 'sunny' and move['type'] == 'Fire':
                other_modifiers *= 1.5
            elif weather == 'sunny' and move['type'] == 'Water':
                other_modifiers *= 0.5
            elif weather == 'rain' and move['type'] == 'Water':
                other_modifiers *= 1.5
            elif weather == 'rain' and move['type'] == 'Fire':
                other_modifiers *= 0.5

            # 帮助类效果
            if attacker.assist_status == 'help':
                other_modifiers *= 1.5

            # 包含道具带来的伤害倍率
            other_modifiers *= attacker_damage_multiplier
            other_modifiers *= defender_damage_multiplier

            # 初始暴击 & STAB 倍率
            critical_multiplier = 2.0 if critical_hit else 1.0
            stab_multiplier = 1.5 if move['type'] in attacker.types else 1.0

            # 让特性修改 other_modifiers / STAB / 暴击倍率 / 属性相克倍率
            other_modifiers, stab_multiplier, critical_multiplier, type_multiplier = \
                self.apply_offensive_ability_effects(attacker, move, other_modifiers,
                                                     stab_multiplier, critical_multiplier,
                                                     type_multiplier, critical_hit)

            other_modifiers, type_multiplier = self.apply_defensive_ability_effects(defender, move,
                                                                                    other_modifiers,
                                                                                    type_multiplier)

            # 第一步：other_modifiers * 暴击 -> 五舍六入
            step1_modifier = other_modifiers * critical_multiplier
            step1_result = self._round_half_up(step1_modifier)

            # 第二步：乘以随机因子（如果未指定则随机生成）
            if random_factor is None:
                random_factor = random.uniform(0.85, 1.0)

            # 为了保留中间显示信息，先计算浮点数各步骤（最终仍按指定规则取整）
            float_step1 = other_modifiers * critical_multiplier               # 其他修正 * 要害
            float_step2 = float_step1 * random_factor                         # * 随机数
            float_step3 = float_step2 * stab_multiplier                       # * STAB
            float_step4 = float_step3 * type_multiplier                       # * 属性相克

            # 最终按规则向下取整一次（并保证至少为1）
            final_modifier = max(1, math.floor(float_step4))

            # 将中间结果按显示需要处理（保留用于调试/显示）
            step1_result = self._round_half_up(float_step1)   # 五舍六入显示的中间值
            step2_result = self._round_half_up(float_step2)
            step3_result = self._round_half_up(float_step3)
            # step4 使用 final_modifier（已 floor）
            # 最终伤害
            final_damage = int(base_damage * final_modifier)

            return {
                'damage': final_damage,
                'base_damage': base_damage,
                'modifiers': {
                    'other_modifiers': other_modifiers,
                    'critical_multiplier': critical_multiplier,
                    'random_factor': random_factor,
                    'stab_multiplier': stab_multiplier,
                    'type_multiplier': type_multiplier,
                    'final_modifier': final_modifier,
                    'attacker_item_multiplier': attacker_damage_multiplier,
                    'defender_item_multiplier': defender_damage_multiplier
                },
                'calculation_steps': {
                    'step1_other_critical': step1_result,
                    'step2_random': step2_result,
                    'step3_stab': step3_result,
                    'step4_type': final_modifier
                },
                'stats_used': {
                    'attack_stat': attack_stat,
                    'defense_stat': defense_stat
                },
                'items_used': {
                    'attacker_item': attacker.item if attacker.item else "无",
                    'defender_item': defender.item if defender.item else "无"
                }
            }
        except Exception as e:
            return {'error': f'Calculation error: {str(e)}'}

    def calculate_damage(self, attacker: Pokemon, defender: Pokemon, move_id: int, 
                        critical_hit: bool = False, random_factor: float = None) -> Dict[str, Union[int, float]]:
        """
        使用宝可梦伤害公式计算伤害，并按指定顺序与取整规则处理。

        修正步骤（按用户指定的顺序与取整规则）:
        1. other_modifiers × 击中要害倍率 -> 五舍六入到整数
        2. × 随机数 -> 向下取整
        3. × 属性一致加成 -> 五舍六入
        4. × 属性相克倍率 -> 向下取整
        """
        if move_id not in self.moves_data:
            return {'error': 'Move not found'}

        move = self.moves_data[move_id]
        return self.calculate_damage_direct(attacker, defender, move, critical_hit, random_factor)

    def calculate_damage_range(self, attacker: Pokemon, defender: Pokemon, move: Dict, 
                              critical_hit: bool = False) -> List[int]:
        """计算伤害区间"""
        damage_range = []
        
        # 计算 16 个随机因子的伤害 (0.85 到 1.0)
        for i in range(16):
            random_factor = 0.85 + (i / 15) * 0.15
            result = self.calculate_damage_direct(attacker, defender, move, critical_hit, random_factor)
            if 'error' not in result:
                damage_range.append(result['damage'])
        
        return damage_range

    def get_damage_statistics(self, attacker: Pokemon, defender: Pokemon, move: Dict, 
                             defender_max_hp: int = None) -> Dict:
        """获取伤害统计信息"""
        normal_range = self.calculate_damage_range(attacker, defender, move, False)
        critical_range = self.calculate_damage_range(attacker, defender, move, True)
        
        if defender_max_hp is None:
            defender_stats = self.calculate_stats(defender)
            defender_max_hp = defender_stats.get('HP', 1)
        
        return {
            'normal': {
                'min': min(normal_range) if normal_range else 0,
                'max': max(normal_range) if normal_range else 0,
                'range': normal_range,
                'ohko_chance': len([d for d in normal_range if d >= defender_max_hp]) / 16 if normal_range else 0
            },
            'critical': {
                'min': min(critical_range) if critical_range else 0,
                'max': max(critical_range) if critical_range else 0,
                'range': critical_range,
                'ohko_chance': len([d for d in critical_range if d >= defender_max_hp]) / 16 if critical_range else 0
            }
        }
    
    def get_pokemon_by_name(self, name: str) -> Optional[Dict]:
        """按中文名字查找宝可梦"""
        for pokemon_id, pokemon_data in self.pokemon_data.items():
            if pokemon_data['name'] == name:
                return {'id': pokemon_id, **pokemon_data}
        return None
    
    def get_move_by_name(self, name: str) -> Optional[Dict]:
        """按中文名字查找招式"""
        for move_id, move_data in self.moves_data.items():
            if move_data['name'] == name:
                return {'id': move_id, **move_data}
        return None
    
    def list_natures(self) -> List[Dict]:
        """列出所有性格及其修正"""
        natures_list = []
        for nature_name, modifiers in self.natures_data.items():
            natures_list.append({
                'name': nature_name,
                'modifiers': modifiers
            })
        return natures_list
    
    def list_attacker_items(self) -> List[str]:
        """列出所有可用的进攻方道具"""
        return list(self.attacker_items.keys())
    
    def list_defender_items(self) -> List[str]:
        """列出所有可用的防守方道具"""
        return list(self.defender_items.keys())

    # 显示辅助方法（用于紧凑输出）
    def get_natures_display(self, limit: Optional[int] = None) -> List[str]:
        """返回格式化的性格显示行（紧凑）"""
        lines = [f"{name}: {mods}" for name, mods in self.natures_data.items()]
        return lines if limit is None else lines[:limit]

    def get_attacker_items_display(self) -> List[str]:
        """返回进攻方道具名称列表（紧凑）"""
        return list(self.attacker_items.keys())

    def get_defender_items_display(self) -> List[str]:
        """返回防守方道具名称列表（紧凑）"""
        return list(self.defender_items.keys())

    def apply_attacker_item_effects(self, pokemon: Pokemon, stats: Dict[str, int], move_type: str, 
                                   type_multiplier: float) -> Dict[str, Union[int, float]]:
        """将进攻方道具效果应用到数值和伤害"""
        if not pokemon.item or pokemon.item not in self.attacker_items:
            return {'stats': stats, 'damage_multiplier': 1.0}
        
        item_data = self.attacker_items[pokemon.item]
        modified_stats = stats.copy()
        damage_multiplier = 1.0
        
        if item_data['type'] == 'attack_boost':
            # 力量头戴、博识眼镜、讲究头戴、讲究眼镜
            stat_name = item_data['stat']
            if stat_name in modified_stats:
                modified_stats[stat_name] = int(modified_stats[stat_name] * item_data['multiplier'])
        
        elif item_data['type'] == 'damage_boost':
            # 属性宝石、属性石板、生命宝珠
            damage_multiplier *= item_data['multiplier']
        
        elif item_data['type'] == 'special_pokemon':
            # 电气球、粗骨头（指定宝可梦的特殊道具）
            pokemon_name = pokemon.name
            target_pokemon = item_data['pokemon']
            
            # 支持单个宝可梦或宝可梦列表
            if isinstance(target_pokemon, list):
                is_target = pokemon_name in target_pokemon
            else:
                is_target = pokemon_name == target_pokemon
            
            if is_target:
                # 若指定 effect == "damage"，则对最终伤害倍率生效；否则按对指定数值进行倍率
                if item_data.get('effect') == 'damage':
                    damage_multiplier *= item_data['multiplier']
                else:
                    for stat_name in item_data.get('stats', []):
                        if stat_name in modified_stats:
                            modified_stats[stat_name] = int(modified_stats[stat_name] * item_data['multiplier'])
        
        elif item_data['type'] == 'type_advantage':
            # 达人带：当对方属性为克制时生效
            if type_multiplier > 1.0:
                damage_multiplier *= item_data['multiplier']
        
        return {'stats': modified_stats, 'damage_multiplier': damage_multiplier}
    
    def apply_defender_item_effects(self, pokemon: Pokemon, stats: Dict[str, int]) -> Dict[str, Union[int, float]]:
        """将防守方道具效果应用到数值和伤害"""
        if not pokemon.item or pokemon.item not in self.defender_items:
            return {'stats': stats, 'damage_multiplier': 1.0}
        
        item_data = self.defender_items[pokemon.item]
        modified_stats = stats.copy()
        damage_multiplier = 1.0
        
        if item_data['type'] == 'damage_reduction':
            # 弱化伤害果实
            damage_multiplier *= item_data['multiplier']
        
        elif item_data['type'] == 'defense_boost':
            # 突击背心
            stat_name = item_data['stat']
            if stat_name in modified_stats:
                modified_stats[stat_name] = int(modified_stats[stat_name] * item_data['multiplier'])
        
        elif item_data['type'] == 'evolution_stone':
            # 进化奇石 / Eviolite - 仅对非最终进化体生效
            if pokemon.id in self.pokemon_data:
                evolution_stage = self.pokemon_data[pokemon.id].get('evolution_stage', 'unknown')
                if evolution_stage == 'not_final':
                    for stat_name in item_data['stats']:
                        if stat_name in modified_stats:
                            modified_stats[stat_name] = int(modified_stats[stat_name] * item_data['multiplier'])
        
        return {'stats': modified_stats, 'damage_multiplier': damage_multiplier}

    def apply_offensive_ability_effects(self, attacker: Pokemon, move: Dict,
                                        other_modifiers: float, stab_multiplier: float,
                                        critical_multiplier: float, type_multiplier: float,
                                        critical_hit: bool) -> Tuple[float, float, float, float]:
        # 标准化特性名（去除前后空格），并安全查找
        name = (attacker.ability or "").strip()
        if not name or name not in getattr(self, 'offensive_abilities', {}):
            return other_modifiers, stab_multiplier, critical_multiplier, type_multiplier

        # 实现常见无额外战斗状态依赖的进攻类特性
        if name == '适应力':
            if move['type'] in attacker.types:
                stab_multiplier = 2.0

        if name == '技术高手':
            if move.get('power', 0) <= 60:
                other_modifiers *= 1.5

        if name == '铁拳':
            if '拳' in move.get('name', ''):
                other_modifiers *= 1.2

        if name == '狙击手':
            if critical_hit:
                critical_multiplier = 3.0

        if name == '无畏':
            if type_multiplier == 0 and move['type'] in ['Normal', 'Fighting']:
                type_multiplier = 1.0

        # 猛火/激流 等 HP% 触发类（在此实现为只要选择就触发）
        hp_trigger_map = {
            '猛火': 'Fire',
            '激流': 'Water',
            '虫之预感': 'Bug',
            '草之毛皮': 'Grass'
        }
        if name in hp_trigger_map:
            want_type = hp_trigger_map[name]
            if move.get('type') == want_type:
                # 无条件触发（不检查当前 HP）
                other_modifiers *= 1.5

        return other_modifiers, stab_multiplier, critical_multiplier, type_multiplier


    def apply_defensive_ability_effects(self, defender: Pokemon, move: Dict,
                                        other_modifiers: float, type_multiplier: float) -> Tuple[float, float]:
        """
        应用防守类特性对属性相克或其他修正的影响。
        返回更新后的 (other_modifiers, type_multiplier)。
        """
        name = defender.ability
        if not name or name not in getattr(self, 'defensive_abilities', {}):
            return other_modifiers, type_multiplier

        # 简单实现若干防守特性
        atk_type = move['type']
        if name == '厚脂肪':
            if atk_type in ['Fire', 'Ice']:
                type_multiplier *= 0.5

        if name == '干燥皮肤':
            if atk_type == 'Water':
                # 干燥皮肤对水属性免疫
                type_multiplier = 0.0
            elif atk_type == 'Fire':
                other_modifiers *= 1.25  # 受到火攻击伤害增加

        if name == '过滤':
            # 过滤：受克制时伤害 ×0.75
            if type_multiplier > 1.0:
                type_multiplier *= 0.75

        if name in ('避雷针', '蓄电'):
            if atk_type == 'Electric':
                type_multiplier = 0.0

        if name == '引水':
            if atk_type == 'Water':
                type_multiplier = 0.0

        if name == '火焰吸收':
            if atk_type == 'Fire':
                type_multiplier = 0.0

        if name == '漂浮':
            if atk_type == 'Ground':
                type_multiplier = 0.0

        if name == '轻装':
            # 轻装：受到物理攻击伤害减半
            if move.get('category') == '物理':
                other_modifiers *= 0.5

        # 多重鳞片等需要检测是否为满血，这里暂不自动触发
        return other_modifiers, type_multiplier


def run_json_mode(input_file=None):
    """JSON 接口模式 - 从标准输入或文件读取 JSON 参数"""
    try:
        if input_file:
            # 从文件读取 JSON
            with open(input_file, 'r', encoding='utf-8') as f:
                input_data = f.read()
        else:
            # 从标准输入读取 JSON，指定编码
            input_data = sys.stdin.read()
        
        # 去除可能的 BOM 和空白字符
        input_data = input_data.strip()
        if input_data.startswith('\ufeff'):
            input_data = input_data[1:]
        json_data = json.loads(input_data)
        
        # 创建计算器（不加载数据文件，因为数据通过 JSON 传入）
        calculator = PokemonDamageCalculator(load_data_files=False)
        
        # 计算伤害
        result = calculator.calculate_damage_from_json(json_data)
        
        # 输出 JSON 结果
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError as e:
        error_result = {'error': f'Invalid JSON input: {str(e)}'}
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)
    except Exception as e:
        error_result = {'error': f'Calculation failed: {str(e)}'}
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)


def main():
    """主函数 - 在此处修改输入数据以计算伤害"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='宝可梦伤害计算器')
    parser.add_argument('--json', action='store_true', help='JSON 接口模式')
    parser.add_argument('--file', type=str, help='JSON 输入文件路径（仅在 --json 模式下使用）')
    args = parser.parse_args()
    
    if args.json:
        run_json_mode(args.file)
        return
    
    # 为 Windows 控制台设置 UTF-8 编码（安全处理，若不可用则忽略）
    import io
    try:
        if hasattr(sys.stdout, "buffer"):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        # 若包装失败（例如在调试器下），保持原样
        pass
    
    # 初始化计算器
    calculator = PokemonDamageCalculator()
    
    # 已注释的加载信息（保持输出简洁）
    # 如需查看已加载的性格/道具等可取消注释
    # print(f"Loaded {len(calculator.natures_data)} natures")
    # print("Available natures / 可用性格:")
    # for line in calculator.get_natures_display(limit=5):
    #     print(f"  {line}")
    # print("  ...")
    # print()
    # print("Available attacker items / 可用进攻方道具:")
    # print("  " + ", ".join(calculator.get_attacker_items_display()))
    # print()
    # print("Available defender items / 可用防守方道具:")
    # print("  " + ", ".join(calculator.get_defender_items_display()))
    # print()
    
    # ===== 在这里修改数据 / 修改双方配置 =====
    
    # 攻击方宝可梦 - 只需输入中文名称
    attacker_name = "皮卡丘"  # 修改此处
    attacker_data = calculator.get_pokemon_by_name(attacker_name)
    if not attacker_data:
        print(f"Error: Pokemon '{attacker_name}' not found!")
        return
    
    attacker = Pokemon(
        id=attacker_data['id'],
        name=attacker_data['name'],
        types=attacker_data['types'],
        base_stats=attacker_data['base_stats'],
        level=50,  # 等级
        nature="固执",  # 性格
        ability="猛火",  # 特性
        item="电气球",  # 道具
        status="",  # 状态
        weather="sunny",  # 天气
        screens=[],  # 墙壁
        assist_status="",  # 辅助状态
        ivs={"HP": 31, "Attack": 31, "Defense": 31, "Sp. Attack": 31, "Sp. Defense": 31, "Speed": 31},
        evs={"HP": 0, "Attack": 252, "Defense": 0, "Sp. Attack": 252, "Sp. Defense": 0, "Speed": 6}
    )
    # 设置当前 HP（用于 HP% 触发的特性；若不使用可不设置）
    attacker_max_stats = calculator.calculate_stats(attacker)
    attacker.current_hp = max(1, int(attacker_max_stats.get('HP', 1) * 0.30))
    
    # 防守方宝可梦 - 只需输入中文名称
    defender_name = "妙蛙种子"  # 修改此处
    defender_data = calculator.get_pokemon_by_name(defender_name)
    if not defender_data:
        print(f"Error: Pokemon '{defender_name}' not found!")
        return
    
    defender = Pokemon(
        id=defender_data['id'],
        name=defender_data['name'],
        types=defender_data['types'],
        base_stats=defender_data['base_stats'],
        level=50,
        nature="勤奋",  # 性格
        ability="",  # 特性
        item=" ",  # 道具（空表示无）
        status="",
        weather="sunny",  # 天气（攻守共用）
        screens=[],
        assist_status="",
        ivs={"HP": 31, "Attack": 31, "Defense": 31, "Sp. Attack": 31, "Sp. Defense": 31, "Speed": 31},
        evs={"HP": 252, "Attack": 0, "Defense": 0, "Sp. Attack": 0, "Sp. Defense": 252, "Speed": 6}
    )
    
    # 招式 - 输入中文招式名
    move_name = "十万伏特"  # 修改此处
    move_data = calculator.get_move_by_name(move_name)
    if not move_data:
        print(f"Error: Move '{move_name}' not found!")
        return
    
    move_id = move_data['id']
    
    # 额外选项
    critical_hit = False  # 是否为暴击
    random_factor = None  # 随机因子（None 表示随机 0.85-1.0）
    
    # ===== 计算伤害 =====
    
    result = calculator.calculate_damage(attacker, defender, move_id, critical_hit, random_factor)
    
    # ------ 更详细的输出（显示倍数、伤害区间、占比等） ------
    attacker_stats = calculator.calculate_stats(attacker)
    defender_stats = calculator.calculate_stats(defender)
    defender_hp = defender_stats.get('HP', 1)
    
    print()
    print(f"  Attacker / 进攻方: Attack(物攻) = {attacker_stats.get('Attack', 0)}  |  Sp. Attack(特攻) = {attacker_stats.get('Sp. Attack', 0)}")
    print(f"  Defender / 防守方: Defense(物防) = {defender_stats.get('Defense', 0)}  |  Sp. Defense(特防) = {defender_stats.get('Sp. Defense', 0)}  |  HP = {defender_hp}")
    print()

    def _fmt_field(val: str) -> str:
        if not val:
            return "无"
        s = str(val).strip()
        return s if s else "无"

    base_damage = result.get('base_damage', 0)
    other_mod = result['modifiers']['other_modifiers']
    stab = result['modifiers']['stab_multiplier']
    type_eff = result['modifiers']['type_multiplier']
    rand_used = result['modifiers']['random_factor']
    atk_item_mult = result['modifiers'].get('attacker_item_multiplier', 1.0)
    def_item_mult = result['modifiers'].get('defender_item_multiplier', 1.0)

    # 输出头信息
    print("=== Pokemon Damage Calculator / 宝可梦伤害计算器 ===")
    print(f"Attacker: {attacker.name} (Lv.{attacker.level})  Item:{_fmt_field(attacker.item)}  Ability:{_fmt_field(attacker.ability)}")
    print(f"Defender: {defender.name} (Lv.{defender.level})  Item:{_fmt_field(defender.item)}  Ability:{_fmt_field(defender.ability)}")
    print(f"Move: {move_data['name']}  Power: {move_data['power']}  Type: {move_data['type']}")
    print()
    
    # 显示天气与墙壁
    print(f"Weather / 天气: Attacker: {_fmt_field(attacker.weather)}  Defender: {_fmt_field(defender.weather)}")
    atk_screens = ', '.join(attacker.screens) if attacker.screens else '无'
    def_screens = ', '.join(defender.screens) if defender.screens else '无'
    print(f"Screens / 墙壁: Attacker: {atk_screens}  Defender: {def_screens}")
    print()

    # 显示倍数明细
    print("Multipliers / 倍率明细:")
    print(f"  Attribute effectiveness (属性相克): x{type_eff:.2f}")
    print(f"  Other modifiers (包含天气/道具/状态等): x{other_mod:.3f}")
    print(f"  STAB (属性一致加成): x{stab:.2f}")
    print(f"  Items (attacker x defender): x{atk_item_mult:.2f} x{def_item_mult:.2f}")
    print()

    # 基于离散随机 0.85..1.00 计算伤害区间
    random_values = [i / 100.0 for i in range(85, 101)]
    damages_no_crit = []
    damages_crit_1_5 = []  # 暴击显示为 1.5x
    for rv in random_values:
        # 非暴击
        float_final = other_mod * 1.0 * rv * stab * type_eff
        final_mod = max(1, math.floor(float_final))
        damages_no_crit.append(base_damage * final_mod)
        # 暴击（1.5）
        float_final_crit = other_mod * 1.5 * rv * stab * type_eff
        final_mod_crit = max(1, math.floor(float_final_crit))
        damages_crit_1_5.append(base_damage * final_mod_crit)

    dmg_min = min(damages_no_crit)
    dmg_max = max(damages_no_crit)
    dmg_min_crit = min(damages_crit_1_5)
    dmg_max_crit = max(damages_crit_1_5)

    pct_min = dmg_min / defender_hp * 100
    pct_max = dmg_max / defender_hp * 100
    pct_min_crit = dmg_min_crit / defender_hp * 100
    pct_max_crit = dmg_max_crit / defender_hp * 100

    print("Damage Ranges / 伤害区间 (基于随机 0.85~1.00):")
    print(f"  Non-crit (非暴击): {dmg_min} - {dmg_max}   ({pct_min:.1f}% - {pct_max:.1f}% of target HP)")
    print(f"  Crit @1.5x (要害显示为 x1.5): {dmg_min_crit} - {dmg_max_crit}   ({pct_min_crit:.1f}% - {pct_max_crit:.1f}% of target HP)")
    print()

    # 一击必杀概率（离散16档随机）
    hits_no_crit = sum(1 for d in damages_no_crit if d >= defender_hp)
    hits_crit_1_5 = sum(1 for d in damages_crit_1_5 if d >= defender_hp)
    prob_no_crit = hits_no_crit / len(random_values)
    prob_crit_1_5 = hits_crit_1_5 / len(random_values)
    print("OHKO Probabilities (离散16档随机 0.85..1.00):")
    print(f"  Without crit: {prob_no_crit*100:.1f}%  ({hits_no_crit}/{len(random_values)})")
    print(f"  Crit (shown as x1.5): {prob_crit_1_5*100:.1f}%  ({hits_crit_1_5}/{len(random_values)})")
    print()

    # 使用当前运行的随机因子展示中间步骤数值
    used_rand = result['modifiers']['random_factor']
    float_no_crit_used = other_mod * 1.0 * used_rand * stab * type_eff
    float_crit_used = other_mod * 1.5 * used_rand * stab * type_eff
    print("Example (using current run's random factor):")
    print(f"  Random factor used: {used_rand:.3f}")
    print(f"  Float final multiplier (non-crit): {float_no_crit_used:.3f} -> int final modifier: {max(1, math.floor(float_no_crit_used))}")
    print(f"  Float final multiplier (crit x1.5): {float_crit_used:.3f} -> int final modifier: {max(1, math.floor(float_crit_used))}")
    print()

    print(f"Base damage (before multipliers): {base_damage}")
    print(f"Final damage (example run): {result['damage']}")
    print()
# 确保作为脚本执行时运行 main()
if __name__ == '__main__':
    main()
