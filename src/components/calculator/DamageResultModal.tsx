'use client';

import React, { useEffect } from 'react';
import { X, TrendingUp, Target, Swords, Info, ArrowRight } from 'lucide-react';
import { ExtendedDamageResult, DirectionalDamageResult, SingleMoveResult } from '@/types/pokemonCalculator';
import DebugInfoPanel from './DebugInfoPanel';
import { formatPercentage, formatDamageRange, sanitizeNumber } from '@/utils/numberValidation';

interface DamageResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExtendedDamageResult | null;
}

// 单个招式结果组件 - 优化为更紧凑的设计
function MoveResultCard({ moveResult }: { moveResult: SingleMoveResult }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      {/* 招式名称 - 更紧凑的头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-purple-500" />
          <h3 className="text-base font-bold text-gray-800">{moveResult.move.name}</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">威力: {moveResult.move.power}</span>
      </div>

      <div className="space-y-3">
        {/* 主要伤害数据 - 更紧凑的布局 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-2">
            <div className="text-xs text-red-600 font-medium mb-1">平均伤害</div>
            <div className="text-lg font-bold text-red-700">{moveResult.damage}</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2">
            <div className="text-xs text-blue-600 font-medium mb-1">基础伤害</div>
            <div className="text-lg font-bold text-blue-700">{moveResult.baseDamage}</div>
          </div>
        </div>

        {/* 百分比伤害 - 简化显示 */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs font-medium text-gray-700 mb-1">百分比伤害</div>
          <div className="flex justify-between text-xs">
            <span>最小: <span className="font-bold">{formatPercentage(sanitizeNumber(moveResult.percentage.min))}</span></span>
            <span className="text-green-600">平均: <span className="font-bold">{formatPercentage(sanitizeNumber(moveResult.percentage.average))}</span></span>
            <span>最大: <span className="font-bold">{formatPercentage(sanitizeNumber(moveResult.percentage.max))}</span></span>
          </div>
        </div>

        {/* KO概率 - 更紧凑的布局 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <div className="text-xs text-red-600">一击必杀</div>
            <div className="text-sm font-bold text-red-700">
              {formatPercentage(sanitizeNumber(moveResult.koChance.ohko))}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <div className="text-xs text-orange-600">两击必杀</div>
            <div className="text-sm font-bold text-orange-700">
              {formatPercentage(sanitizeNumber(moveResult.koChance['2hko']))}
            </div>
          </div>
        </div>

        {/* 伤害范围 - 简化显示 */}
        <div className="text-center">
          <div className="text-xs text-gray-500">
            伤害范围: {formatDamageRange(moveResult.damageRange)}
          </div>
        </div>

        {/* 调试信息面板 */}
        {moveResult.debugInfo && (
          <div className="mt-3">
            <DebugInfoPanel 
              debugInfo={moveResult.debugInfo} 
              moveName={moveResult.move.name} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 单方向伤害结果组件 - 优化招式列表布局
function PokemonDamageSection({ 
  damageResult, 
  title, 
  titleColor,
  bgColor 
}: { 
  damageResult: DirectionalDamageResult;
  title: string;
  titleColor: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 h-full flex flex-col`}>
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4">
        <Target className={`w-5 h-5 ${titleColor}`} />
        <h3 className={`text-lg font-bold ${titleColor}`}>
          {title}
        </h3>
      </div>

      {/* 精灵对战信息 */}
      <div className="mb-4 p-3 bg-white/50 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-medium text-gray-800">{damageResult.attackerName}</span>
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-800">{damageResult.defenderName}</span>
        </div>
      </div>

      {/* 招式结果列表 - 使用2列网格布局 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
          {damageResult.moves.map((moveResult, index) => (
            <MoveResultCard key={index} moveResult={moveResult} />
          ))}
        </div>
      </div>

      {/* 修正值详情 - 更紧凑的显示 */}
      {damageResult.moves.length > 0 && damageResult.moves[0]?.modifiers && (
        <div className="mt-4 pt-3 border-t border-white/30">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-medium text-gray-700">修正值详情</h4>
            <span className="text-xs text-gray-500">（以第一个招式为例）</span>
          </div>
          
          <div className="bg-white/50 rounded-lg p-2 grid grid-cols-2 gap-2 text-xs">
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

export default function DamageResultModal({ isOpen, onClose, result }: DamageResultModalProps) {
  // ESC键关闭弹窗
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 如果弹窗未打开或没有结果，不渲染
  if (!isOpen || !result) {
    return null;
  }

  // 点击背景关闭弹窗
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-7xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-800">伤害计算结果</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="关闭弹窗"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 对战信息概览 */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
          <div className="text-center">
            <div className="text-base font-bold text-gray-800 mb-2">对战双方</div>
            <div className="flex items-center justify-center gap-4">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {result.pokemonAName}
              </span>
              <span className="text-gray-400 text-lg">VS</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {result.pokemonBName}
              </span>
            </div>
          </div>
        </div>

        {/* 弹窗内容 - 调整为85vh并优化布局 */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* 精灵A攻击精灵B的结果 */}
            <PokemonDamageSection
              damageResult={result.pokemonAToB}
              title={`${result.pokemonAName} 攻击 ${result.pokemonBName}`}
              titleColor="text-red-600"
              bgColor="bg-gradient-to-br from-red-50 to-red-100"
            />

            {/* 精灵B攻击精灵A的结果 */}
            <PokemonDamageSection
              damageResult={result.pokemonBToA}
              title={`${result.pokemonBName} 攻击 ${result.pokemonAName}`}
              titleColor="text-blue-600"
              bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}