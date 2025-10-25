'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Zap, Target, Shuffle } from 'lucide-react';
import { WEATHER_CONDITIONS, TERRAIN_CONDITIONS } from '@/types/pokemonCalculator';

interface BattleConditionsPanelProps {
  conditions: {
    weather: string;
    terrain: string;
    criticalHit: boolean;
    randomFactor: number;
  };
  onUpdate: (updates: Partial<BattleConditionsPanelProps['conditions']>) => void;
}

export default function BattleConditionsPanel({ conditions, onUpdate }: BattleConditionsPanelProps) {
  const [isSystemRandom, setIsSystemRandom] = useState(false);

  // 生成0.85-1之间的随机数
  const generateRandomFactor = () => {
    return Math.random() * (1 - 0.85) + 0.85;
  };

  // 当系统随机状态改变时，生成新的随机数
  useEffect(() => {
    if (isSystemRandom) {
      const newRandomFactor = generateRandomFactor();
      onUpdate({ randomFactor: newRandomFactor });
    }
  }, [isSystemRandom, onUpdate]);

  // 处理随机因子输入变化
  const handleRandomFactorChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.85 && numValue <= 1.0) {
      onUpdate({ randomFactor: numValue });
    }
  };

  // 处理系统随机切换
  const handleSystemRandomToggle = (checked: boolean) => {
    setIsSystemRandom(checked);
    if (checked) {
      const newRandomFactor = generateRandomFactor();
      onUpdate({ randomFactor: newRandomFactor });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="w-6 h-6 text-purple-500" />
        <h2 className="text-xl font-bold text-gray-800">战斗条件</h2>
      </div>

      <div className="space-y-6">
        {/* 天气 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">天气</label>
          <select
            value={conditions.weather}
            onChange={(e) => onUpdate({ weather: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {WEATHER_CONDITIONS.map(weather => (
              <option key={weather} value={weather}>
                {weather || '无天气'}
              </option>
            ))}
          </select>
        </div>

        {/* 场地 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">场地</label>
          <select
            value={conditions.terrain}
            onChange={(e) => onUpdate({ terrain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {TERRAIN_CONDITIONS.map(terrain => (
              <option key={terrain} value={terrain}>
                {terrain || '无场地'}
              </option>
            ))}
          </select>
        </div>

        {/* 会心一击 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <label className="text-sm font-medium text-gray-600">会心一击</label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.criticalHit}
              onChange={(e) => onUpdate({ criticalHit: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* 随机因子 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            随机因子 (0.85 - 1.00)
          </label>
          
          {/* 系统随机选项 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-blue-500" />
              <label className="text-sm font-medium text-gray-600">系统随机</label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSystemRandom}
                onChange={(e) => handleSystemRandomToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 随机因子输入框 */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.85"
              max="1.00"
              step="0.01"
              value={conditions.randomFactor.toFixed(2)}
              onChange={(e) => handleRandomFactorChange(e.target.value)}
              readOnly={isSystemRandom}
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                isSystemRandom ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="0.85 - 1.00"
            />
            {isSystemRandom && (
              <button
                onClick={() => {
                  const newRandomFactor = generateRandomFactor();
                  onUpdate({ randomFactor: newRandomFactor });
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                title="重新生成随机数"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            当前值: {conditions.randomFactor.toFixed(3)}
          </div>
        </div>

        {/* 说明文字 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">说明</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 天气和场地会影响某些招式的威力和效果</li>
            <li>• 会心一击会将伤害乘以1.5倍</li>
            <li>• 随机因子模拟游戏中的伤害浮动（0.85-1.00）</li>
            <li>• 系统随机开启时会自动生成随机因子</li>
          </ul>
        </div>
      </div>
    </div>
  );
}