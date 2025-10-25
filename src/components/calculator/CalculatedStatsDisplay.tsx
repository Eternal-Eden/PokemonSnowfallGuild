'use client';

import React from 'react';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { PokemonStats, PokemonIVs, PokemonEVs } from '@/types/auth';
import { CalculatorPokemonState } from '@/types/pokemonCalculator';
import { calculateAllStats, getNatureModifierText, getNatureModifierColor } from '@/utils/pokemonStatsCalculator';

interface CalculatedStatsDisplayProps {
  baseStats: CalculatorPokemonState['baseStats'];
  ivs: CalculatorPokemonState['ivs'];
  evs: CalculatorPokemonState['evs'];
  level: number;
  nature: string;
  pokemonName: string; // 新增：宝可梦名称用于判断是否选择了模板
}

export default function CalculatedStatsDisplay({
  baseStats,
  ivs,
  evs,
  level,
  nature,
  pokemonName
}: CalculatedStatsDisplayProps) {
  // 检查是否选择了有效的宝可梦模板
  const hasValidPokemon = pokemonName && pokemonName.trim() !== '';
  
  // 如果没有选择宝可梦，显示提示信息
  if (!hasValidPokemon) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-500">计算后能力值</h4>
          <TrendingUp className="w-4 h-4 text-gray-400" />
        </div>

        {/* 提示信息 */}
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">请先选择宝可梦模板</p>
            <p className="text-xs text-gray-400">选择模板后将显示计算后的能力值</p>
          </div>
        </div>
      </div>
    );
  }

  // 转换属性格式以适配calculateAllStats函数
  const convertedBaseStats: PokemonStats = {
    hp: baseStats.HP,
    attack: baseStats.Attack,
    defense: baseStats.Defense,
    specialAttack: baseStats['Sp. Attack'],
    spDefense: baseStats['Sp. Defense'],
    speed: baseStats.Speed
  };

  const convertedIVs: PokemonIVs = {
    hp: ivs.HP,
    attack: ivs.Attack,
    defense: ivs.Defense,
    specialAttack: ivs['Sp. Attack'],
    spDefense: ivs['Sp. Defense'],
    speed: ivs.Speed
  };

  const convertedEVs: PokemonEVs = {
    hp: evs.HP,
    attack: evs.Attack,
    defense: evs.Defense,
    specialAttack: evs['Sp. Attack'],
    spDefense: evs['Sp. Defense'],
    speed: evs.Speed
  };

  // 计算最终能力值
  const calculatedStats = calculateAllStats(convertedBaseStats, convertedIVs, convertedEVs, level, nature);

  // 能力值映射（用于显示）
  const statLabels = {
    hp: 'HP',
    attack: '攻击',
    defense: '防御',
    specialAttack: '特攻',
    spDefense: '特防',
    speed: '速度'
  };

  // 能力值颜色映射
  const statColors = {
    hp: 'text-green-600',
    attack: 'text-red-600',
    defense: 'text-yellow-600',
    specialAttack: 'text-blue-600',
    spDefense: 'text-purple-600',
    speed: 'text-pink-600'
  };

  // 原始属性名映射（用于获取性格修正）
  const statToNatureKey = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    specialAttack: 'Sp_Attack',
    spDefense: 'Sp_Defense',
    speed: 'Speed'
  } as const;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-green-600" />
        <h4 className="text-sm font-semibold text-gray-700">计算后能力值</h4>
        <TrendingUp className="w-4 h-4 text-blue-500" />
      </div>

      {/* 能力值网格 */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(calculatedStats).map(([statKey, value]) => {
          const key = statKey as keyof PokemonStats;
          const natureKey = statToNatureKey[key];
          const natureModifierText = getNatureModifierText(nature, natureKey);
          const natureModifierColor = getNatureModifierColor(nature, natureKey);

          return (
            <div
              key={statKey}
              className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  {statLabels[key]}
                </span>
                {natureModifierText && (
                  <span className={`text-xs font-medium ${natureModifierColor}`}>
                    {natureModifierText}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${statColors[key]}`}>
                  {value}
                </span>
                
                {/* 显示计算详情 */}
                <div className="text-xs text-gray-500">
                  <div>种族: {convertedBaseStats[key]}</div>
                  <div>个体: {convertedIVs[key]}</div>
                  <div>努力: {convertedEVs[key]}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 计算说明 */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          等级 {level} · 性格: {nature}
        </div>
      </div>
    </div>
  );
}