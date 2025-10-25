'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Search, RotateCcw, AlertCircle } from 'lucide-react';
import PokemonPanel from '@/components/calculator/PokemonPanel';
import BattleConditionsPanel from '@/components/calculator/BattleConditionsPanel';
import DamageResultModal from '@/components/calculator/DamageResultModal';
import TemplateSelector from '@/components/calculator/TemplateSelector';
import { useDamageCalculator } from '@/hooks/useDamageCalculator';
import { 
  CalculatorPokemonState
} from '@/types/pokemonCalculator';

export default function DamageCalculatorPage() {
  // Use damage calculator hook
  const {
    state: calculatorState,
    result: damageResult,
    isLoading,
    error: calculationError,
    canCalculate,
    updateAttacker,
    updateDefender,
    updateBattleConditions,
    calculateDamage,
    resetCalculator,
    loadTemplate
  } = useDamageCalculator();
  
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<'pokemonA' | 'pokemonB'>('pokemonA');
  const [showResultModal, setShowResultModal] = useState(false);

  // Open template selector
  const openTemplateSelector = useCallback((target: 'pokemonA' | 'pokemonB') => {
    setTemplateTarget(target);
    setShowTemplateSelector(true);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: any) => {
    try {
      console.log('Template selected:', template);
      
      // Use the loadTemplate method from the hook
      const target = templateTarget === 'pokemonA' ? 'attacker' : 'defender';
      loadTemplate(template, target);

      setShowTemplateSelector(false);
    } catch (error) {
      console.error('Error handling template selection:', error);
    }
  }, [templateTarget, loadTemplate]);

  // Handle calculate button click
  const handleCalculateClick = useCallback(async () => {
    if (!canCalculate) {
      return;
    }
    
    await calculateDamage();
    // 计算完成后显示弹窗
    setShowResultModal(true);
  }, [canCalculate, calculateDamage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Page title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-800">宝可梦伤害计算器</h1>
          </div>
          <p className="text-gray-600">精确计算宝可梦对战中的伤害数值</p>
        </div>

        {/* Error message */}
        {calculationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">计算错误</span>
            </div>
            <p className="text-red-600 mt-1">{calculationError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleCalculateClick}
            disabled={isLoading || !canCalculate}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors text-white ${
              isLoading || !canCalculate
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <Calculator className="w-5 h-5" />
            {isLoading ? '计算中...' : '计算所有招式伤害'}
          </button>
          
          <button
            onClick={() => openTemplateSelector('pokemonA')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Search className="w-5 h-5" />
            选择精灵A模板
          </button>
          
          <button
            onClick={() => openTemplateSelector('pokemonB')}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Search className="w-5 h-5" />
            选择精灵B模板
          </button>
          
          <button
            onClick={resetCalculator}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            重置
          </button>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pokemon A panel */}
          <div className="lg:col-span-1">
            <PokemonPanel
              pokemon={calculatorState.attacker}
              onUpdate={updateAttacker}
              title="精灵A"
              type="pokemonA"
            />
          </div>

          {/* Middle area: battle conditions */}
          <div className="lg:col-span-1 space-y-6">
            <BattleConditionsPanel
              conditions={calculatorState.battleConditions}
              onUpdate={updateBattleConditions}
            />
            
            {/* Calculation hint */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">准备计算伤害</p>
                <p className="text-sm">点击"计算所有招式伤害"按钮开始计算</p>
                <p className="text-sm mt-2 text-gray-400">计算结果将在弹窗中显示</p>
              </div>
            </div>
          </div>

          {/* Pokemon B panel */}
          <div className="lg:col-span-1">
            <PokemonPanel
              pokemon={calculatorState.defender}
              onUpdate={updateDefender}
              title="精灵B"
              type="pokemonB"
            />
          </div>
        </div>

        {/* Template selector modal */}
        {showTemplateSelector && (
          <TemplateSelector
            isOpen={showTemplateSelector}
            onClose={() => setShowTemplateSelector(false)}
            onSelect={handleTemplateSelect}
            title={templateTarget === 'pokemonA' ? '选择精灵A模板' : '选择精灵B模板'}
          />
        )}

        {/* Damage result modal */}
        <DamageResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          result={damageResult}
        />
      </div>
    </div>
  );
}