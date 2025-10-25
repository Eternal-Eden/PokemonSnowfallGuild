'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Bug, Calculator, Zap, Cloud, Mountain, Target, Activity, BarChart3 } from 'lucide-react';
import { DebugInfo } from '@/types/pokemonCalculator';

interface DebugInfoPanelProps {
  debugInfo: DebugInfo;
  moveName: string;
}

export default function DebugInfoPanel({ debugInfo, moveName }: DebugInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      {/* 可折叠的标题栏 */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            {moveName} - 计算过程详情
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* 展开的调试信息内容 */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* 性格修正数据 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-800">性格修正数据</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-2">攻击方性格修正</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono">{debugInfo.attackerNatureModifiers.attack.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono">{debugInfo.attackerNatureModifiers.defense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono">{debugInfo.attackerNatureModifiers.spAttack.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono">{debugInfo.attackerNatureModifiers.spDefense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono">{debugInfo.attackerNatureModifiers.speed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-2">防守方性格修正</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono">{debugInfo.defenderNatureModifiers.attack.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono">{debugInfo.defenderNatureModifiers.defense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono">{debugInfo.defenderNatureModifiers.spAttack.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono">{debugInfo.defenderNatureModifiers.spDefense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono">{debugInfo.defenderNatureModifiers.speed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 环境效果数据 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-800">环境效果</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-gray-600 mb-1">随机因子</div>
                <div className="font-mono text-purple-600 font-semibold">
                  {debugInfo.randomFactor.toFixed(3)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 mb-1">天气效果</div>
                <div className="font-mono text-blue-600 font-semibold">
                  {debugInfo.weatherEffect.multiplier.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 mb-1">场地效果</div>
                <div className="font-mono text-green-600 font-semibold">
                  {debugInfo.terrainEffect.multiplier.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* 属性相克数据 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-600" />
              <h4 className="text-sm font-semibold text-gray-800">属性相克</h4>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">属性相克倍率</div>
              <div className={`font-mono text-lg font-bold ${
                debugInfo.typeEffectiveness.multiplier > 1 ? 'text-green-600' : 
                debugInfo.typeEffectiveness.multiplier < 1 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {debugInfo.typeEffectiveness.multiplier.toFixed(2)}×
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {debugInfo.typeEffectiveness.effectiveness}
              </div>
            </div>
          </div>

          {/* IV/EV 数据 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-semibold text-gray-800">个体值/努力值</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-2">攻击方 IV/EV</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-mono">{debugInfo.attackerIVs.HP}/{debugInfo.attackerEVs.HP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono">{debugInfo.attackerIVs.Attack}/{debugInfo.attackerEVs.Attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono">{debugInfo.attackerIVs.Defense}/{debugInfo.attackerEVs.Defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono">{debugInfo.attackerIVs['Sp. Attack']}/{debugInfo.attackerEVs['Sp. Attack']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono">{debugInfo.attackerIVs['Sp. Defense']}/{debugInfo.attackerEVs['Sp. Defense']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono">{debugInfo.attackerIVs.Speed}/{debugInfo.attackerEVs.Speed}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-2">防守方 IV/EV</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-mono">{debugInfo.defenderIVs.HP}/{debugInfo.defenderEVs.HP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono">{debugInfo.defenderIVs.Attack}/{debugInfo.defenderEVs.Attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono">{debugInfo.defenderIVs.Defense}/{debugInfo.defenderEVs.Defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono">{debugInfo.defenderIVs['Sp. Attack']}/{debugInfo.defenderEVs['Sp. Attack']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono">{debugInfo.defenderIVs['Sp. Defense']}/{debugInfo.defenderEVs['Sp. Defense']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono">{debugInfo.defenderIVs.Speed}/{debugInfo.defenderEVs.Speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最终计算值 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-600" />
              <h4 className="text-sm font-semibold text-gray-800">最终计算值</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-2">攻击方最终能力值</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.spAttack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.spDefense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono font-semibold">{debugInfo.attackerFinalStats.speed}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-2">防守方最终能力值</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>攻击:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>防御:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特攻:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.spAttack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特防:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.spDefense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>速度:</span>
                    <span className="font-mono font-semibold">{debugInfo.defenderFinalStats.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 数学计算等式 */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-orange-600" />
              <h4 className="text-sm font-semibold text-gray-800">数学计算等式</h4>
            </div>
            
            {/* 基础伤害计算 */}
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2">基础伤害计算</div>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                <div className="text-gray-700 mb-1">{debugInfo.baseDamageFormula.formula}</div>
                <div className="text-blue-600">
                  = ((2 × {debugInfo.baseDamageFormula.level} + 10) ÷ 250) × 
                  ({debugInfo.baseDamageFormula.attack} ÷ {debugInfo.baseDamageFormula.defense}) × 
                  {debugInfo.baseDamageFormula.power} + 2
                </div>
                <div className="text-green-600 font-semibold">
                  = {debugInfo.baseDamageFormula.result}
                </div>
              </div>
            </div>

            {/* 计算步骤 */}
            {debugInfo.calculationEquations && debugInfo.calculationEquations.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">计算步骤</div>
                <div className="space-y-2">
                  {debugInfo.calculationEquations.map((equation, index) => (
                    <div key={index} className="bg-gray-50 rounded p-2 text-xs font-mono">
                      <div className="text-gray-700 mb-1">{equation.step}</div>
                      <div className="text-blue-600">{equation.formula}</div>
                      <div className="text-green-600 font-semibold">= {equation.result}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}