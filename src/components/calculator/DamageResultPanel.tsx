'use client';

import React from 'react';
import { TrendingUp, Target, Zap, Info, Swords, ArrowRight } from 'lucide-react';
import { ExtendedDamageResult, DirectionalDamageResult, SingleMoveResult } from '@/types/pokemonCalculator';
import { formatPercentage, formatDamageRange, sanitizeNumber } from '@/utils/numberValidation';

interface DamageResultPanelProps {
  result: ExtendedDamageResult;
}

// 单个招式结果组件
function MoveResultCard({ moveResult }: { moveResult: SingleMoveResult }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* 招式名称 */}
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-bold text-gray-800">{moveResult.move.name}</h3>
        <span className="text-sm text-gray-500">威力: {moveResult.move.power}</span>
      </div>

      <div className="space-y-4">
        {/* 主要伤害数据 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3">
            <div className="text-xs text-red-600 font-medium mb-1">平均伤害</div>
            <div className="text-xl font-bold text-red-700">{moveResult.damage}</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">基础伤害</div>
            <div className="text-xl font-bold text-blue-700">{moveResult.baseDamage}</div>
          </div>
        </div>

        {/* 百分比伤害 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">百分比伤害</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-600">最小</div>
              <div className="font-bold text-blue-700">{formatPercentage(sanitizeNumber(moveResult.percentage.min))}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">平均</div>
              <div className="font-bold text-green-600">{formatPercentage(sanitizeNumber(moveResult.percentage.average))}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">最大</div>
              <div className="font-bold text-blue-700">{formatPercentage(sanitizeNumber(moveResult.percentage.max))}</div>
            </div>
          </div>
        </div>

        {/* KO概率 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800">一击必杀</span>
            </div>
            <div className="text-lg font-bold text-red-700">
              {formatPercentage(sanitizeNumber(moveResult.koChance.ohko))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800">两击必杀</span>
            </div>
            <div className="text-lg font-bold text-orange-700">
              {formatPercentage(sanitizeNumber(moveResult.koChance['2hko']))}
            </div>
          </div>
        </div>

        {/* 伤害范围 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">伤害范围</span>
          </div>
          <div className="text-center text-lg font-bold text-gray-800">
            {formatDamageRange(moveResult.damageRange)}
          </div>
        </div>
      </div>
    </div>
  );
}

// 单方向伤害结果组件
function DirectionalDamageSection({ 
  damageResult, 
  title, 
  titleColor 
}: { 
  damageResult: DirectionalDamageResult;
  title: string;
  titleColor: string;
}) {
  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 ${titleColor}`} />
        <h3 className={`text-lg font-bold ${titleColor}`}>
          {title}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{damageResult.attackerName}</span>
          <ArrowRight className="w-4 h-4 inline mx-1" />
          <span className="font-medium">{damageResult.defenderName}</span>
        </div>
      </div>

      {/* 招式结果网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {damageResult.moves.map((moveResult, index) => (
          <MoveResultCard key={index} moveResult={moveResult} />
        ))}
      </div>

      {/* 修正值详情 */}
      {damageResult.moves.length > 0 && damageResult.moves[0]?.modifiers && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <h4 className="font-medium text-gray-700">修正值详情</h4>
            <span className="text-sm text-gray-500">（以第一个招式为例）</span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>本系加成:</span>
              <span className="font-medium">×{damageResult.moves[0].modifiers.stabMultiplier ?? 1}</span>
            </div>
            <div className="flex justify-between">
              <span>属性相性:</span>
              <span className="font-medium">×{damageResult.moves[0].modifiers.typeMultiplier ?? 1}</span>
            </div>
            <div className="flex justify-between">
              <span>会心一击:</span>
              <span className="font-medium">×{damageResult.moves[0].modifiers.criticalMultiplier ?? 1}</span>
            </div>
            <div className="flex justify-between">
              <span>随机因子:</span>
              <span className="font-medium">×{damageResult.moves[0].modifiers.randomFactor ?? 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DamageResultPanel({ result }: DamageResultPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-bold text-gray-800">双向伤害计算结果</h2>
      </div>

      {/* 对战信息概览 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800 mb-2">对战双方</div>
          <div className="flex items-center justify-center gap-4">
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              {result.pokemonAName}
            </span>
            <span className="text-gray-400">VS</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {result.pokemonBName}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* 精灵A对精灵B的伤害 */}
        <DirectionalDamageSection
          damageResult={result.pokemonAToB}
          title="精灵A攻击精灵B"
          titleColor="text-red-600"
        />

        {/* 分隔线 */}
        <div className="border-t-2 border-dashed border-gray-300 my-8"></div>

        {/* 精灵B对精灵A的伤害 */}
        <DirectionalDamageSection
          damageResult={result.pokemonBToA}
          title="精灵B攻击精灵A"
          titleColor="text-blue-600"
        />
      </div>
    </div>
  );
}