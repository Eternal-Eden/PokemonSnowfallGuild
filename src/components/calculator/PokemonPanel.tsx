'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sword, Shield } from 'lucide-react';
import { CalculatorPokemonState, MoveInfo, NATURES } from '@/types/pokemonCalculator';
import CalculatedStatsDisplay from './CalculatedStatsDisplay';
import { useDamageCalculator } from '@/hooks/useDamageCalculator';
import { NATURE_MODIFIERS } from '@/lib/pokemonDamageCalculator';

interface PokemonPanelProps {
  pokemon: CalculatorPokemonState;
  onUpdate: (updates: Partial<CalculatorPokemonState>) => void;
  title: string;
  type: 'pokemonA' | 'pokemonB';
}

export default function PokemonPanel({ 
  pokemon, 
  onUpdate, 
  title, 
  type
}: PokemonPanelProps) {
  const { getMovesByNames } = useDamageCalculator();
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    stats: true,
    calculatedStats: true, // 新增：计算后能力值展开状态
    moves: true // 现在攻击方和防守方都显示招式选择
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 计算总努力值
  const totalEVs = Object.values(pokemon.evs).reduce((sum, ev) => sum + ev, 0);

  // 更新个体值
  const updateIV = (stat: keyof typeof pokemon.ivs, value: number) => {
    const clampedValue = Math.max(0, Math.min(31, value));
    onUpdate({
      ivs: { ...pokemon.ivs, [stat]: clampedValue }
    });
  };

  // 更新努力值
  const updateEV = (stat: keyof typeof pokemon.evs, value: number) => {
    const clampedValue = Math.max(0, Math.min(252, value));
    const newEVs = { ...pokemon.evs, [stat]: clampedValue };
    
    // 检查总努力值是否超过510
    const newTotal = Object.values(newEVs).reduce((sum, ev) => sum + ev, 0);
    if (newTotal <= 510) {
      onUpdate({ evs: newEVs });
    }
  };

  // 从pokemon.moves获取招式数据，使用useDamageCalculator hook
  const getAvailableMoves = (): MoveInfo[] => {
    if (pokemon.moves && pokemon.moves.length > 0) {
      // 如果pokemon.moves是对象数组
      if (typeof pokemon.moves[0] === 'object' && 'moveName' in pokemon.moves[0]) {
        const moveNames = pokemon.moves.map((move: any) => move.moveName).filter(Boolean);
        return getMovesByNames(moveNames);
      }
      // 如果pokemon.moves是字符串数组
      else if (typeof pokemon.moves[0] === 'string') {
        return getMovesByNames(pokemon.moves);
      }
    }
    
    // 如果没有招式数据，返回空数组
    return [];
  };

  const availableMoves = getAvailableMoves();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        {type === 'pokemonA' ? (
          <Sword className="w-6 h-6 text-red-500" />
        ) : (
          <Shield className="w-6 h-6 text-blue-500" />
        )}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>

      {/* 基础信息 */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('basic')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
        >
          基础信息
          {expandedSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.basic && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">宝可梦名称</label>
              <input
                type="text"
                value={pokemon.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="输入宝可梦名称"
              />
            </div>

            {/* 属性显示 */}
            {pokemon.types && pokemon.types.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">属性</label>
                <div className="flex gap-2">
                  {pokemon.types.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">等级</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pokemon.level}
                  onChange={(e) => onUpdate({ level: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">性格</label>
                <select
                  value={pokemon.nature}
                  onChange={(e) => onUpdate({ nature: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {NATURES.map(nature => (
                    <option key={nature} value={nature}>{nature}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 性格修正显示 */}
            {pokemon.nature && NATURE_MODIFIERS[pokemon.nature] && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">性格修正</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(NATURE_MODIFIERS[pokemon.nature]).map(([stat, modifier]) => {
                    if (stat === 'name') return null; // 跳过name字段
                    
                    let colorClass = 'text-gray-600'; // 默认颜色（1.0倍）
                    let modifierText = '×1.0';
                    
                    if (modifier > 1.0) {
                      colorClass = 'text-green-600 font-semibold'; // 增加（1.1倍）
                      modifierText = '×1.1';
                    } else if (modifier < 1.0) {
                      colorClass = 'text-red-600 font-semibold'; // 减少（0.9倍）
                      modifierText = '×0.9';
                    }
                    
                    return (
                      <div key={stat} className={`flex justify-between items-center py-1 px-2 rounded ${colorClass}`}>
                        <span>{stat}</span>
                        <span>{modifierText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">特性</label>
              <input
                type="text"
                value={pokemon.ability}
                onChange={(e) => onUpdate({ ability: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="输入特性名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">道具</label>
              <input
                type="text"
                value={pokemon.item}
                onChange={(e) => onUpdate({ item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="输入道具名称"
              />
            </div>
          </div>
        )}
      </div>

      {/* 能力值 */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('stats')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
        >
          能力值设置
          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.stats && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-2">
              总努力值: {totalEVs}/510
            </div>
            
            {Object.entries(pokemon.ivs).map(([stat, iv]) => (
              <div key={stat} className="grid grid-cols-3 gap-2 items-center">
                <div className="text-sm font-medium text-gray-600">{stat}</div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">个体值</label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={iv}
                    onChange={(e) => updateIV(stat as keyof typeof pokemon.ivs, parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">努力值</label>
                  <input
                    type="number"
                    min="0"
                    max="252"
                    value={pokemon.evs[stat as keyof typeof pokemon.evs]}
                    onChange={(e) => updateEV(stat as keyof typeof pokemon.evs, parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 计算后能力值 - 新增区域 */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('calculatedStats')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
        >
          计算后能力值
          {expandedSections.calculatedStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.calculatedStats && (
          <CalculatedStatsDisplay
            baseStats={pokemon.baseStats}
            ivs={pokemon.ivs}
            evs={pokemon.evs}
            level={pokemon.level}
            nature={pokemon.nature}
            pokemonName={pokemon.name}
          />
        )}
      </div>

      {/* 招式列表（仅显示，不可选择） */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('moves')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
        >
          招式列表
          {expandedSections.moves ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.moves && (
          <div className="space-y-2">
            {availableMoves.map(move => (
              <div
                key={move.id}
                className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{move.name}</div>
                    <div className="text-sm text-gray-600">
                      {move.type} · {move.category} · 威力{move.power}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    命中{move.accuracy}%
                  </div>
                </div>
              </div>
            ))}
            <div className="text-xs text-gray-500 mt-2">
              计算时将使用所有招式
            </div>
          </div>
        )}
      </div>
    </div>
  );
}