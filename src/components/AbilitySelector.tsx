'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, Sword, Info, Search, X } from 'lucide-react';
import { 
  ExtendedAbilityData, 
  getPokemonAbilities, 
  getAbilityByName 
} from '@/utils/abilityDataProcessor';

interface AbilitySelectorProps {
  pokemonName?: string;
  selectedAbility?: ExtendedAbilityData | null;
  onAbilitySelect: (abilityData: ExtendedAbilityData) => void;
  disabled?: boolean;
  className?: string;
}

export default function AbilitySelector({
  pokemonName,
  selectedAbility,
  onAbilitySelect,
  disabled = false,
  className = ''
}: AbilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [abilities, setAbilities] = useState<ExtendedAbilityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAbilityData, setSelectedAbilityData] = useState<ExtendedAbilityData | null>(null);

  // 加载宝可梦的特性列表
  useEffect(() => {
    if (pokemonName) {
      loadAbilities();
    } else {
      setAbilities([]);
      setSelectedAbilityData(null);
    }
  }, [pokemonName]);

  // 设置选中特性的详细数据
  useEffect(() => {
    setSelectedAbilityData(selectedAbility || null);
  }, [selectedAbility]);

  const loadAbilities = async () => {
    if (!pokemonName) return;
    
    setLoading(true);
    try {
      const pokemonAbilities = await getPokemonAbilities(pokemonName);
      setAbilities(pokemonAbilities);
    } catch (error) {
      console.error('加载特性列表失败:', error);
      setAbilities([]);
    } finally {
      setLoading(false);
    }
  };



  // 过滤特性列表
  const filteredAbilities = useMemo(() => {
    if (!searchQuery.trim()) return abilities;
    
    const query = searchQuery.toLowerCase();
    return abilities.filter(ability => 
      ability.name.toLowerCase().includes(query) ||
      ability.name_en.toLowerCase().includes(query) ||
      ability.text.toLowerCase().includes(query)
    );
  }, [abilities, searchQuery]);

  const handleAbilitySelect = (ability: ExtendedAbilityData) => {
    onAbilitySelect(ability);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onAbilitySelect(null as any);
  };

  const getSpecialTypeIcon = (type?: 'offensive' | 'defensive') => {
    if (type === 'defensive') {
      return <Shield className="w-4 h-4 text-green-500" />;
    } else if (type === 'offensive') {
      return <Sword className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getSpecialTypeBadge = (type?: 'offensive' | 'defensive') => {
    if (type === 'defensive') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          <Shield className="w-3 h-3" />
          防守型
        </span>
      );
    } else if (type === 'offensive') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <Sword className="w-3 h-3" />
          攻击型
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* 选择器容器 */}
      <div className="relative flex items-center">
        {/* 主选择器按钮 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || !pokemonName || loading}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-left
            border border-gray-300 rounded-lg bg-white
            hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200
            ${selectedAbilityData ? 'pr-16' : 'pr-10'}
          `}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedAbilityData?.isSpecial && getSpecialTypeIcon(selectedAbilityData.specialType)}
            <span className="truncate">
              {loading ? '加载中...' : selectedAbilityData?.name || '选择特性'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* 清除按钮 - 独立于主按钮 */}
        {selectedAbilityData && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded z-10"
            title="清除选择"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* 下拉列表 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden"
          >
            {/* 搜索框 */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索特性..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 特性列表 */}
            <div className="max-h-60 overflow-y-auto">
              {filteredAbilities.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {abilities.length === 0 ? '该宝可梦没有可用特性' : '没有找到匹配的特性'}
                </div>
              ) : (
                filteredAbilities.map((ability) => (
                  <div
                    key={ability.index}
                    onClick={() => handleAbilitySelect(ability)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAbilitySelect(ability);
                      }
                    }}
                    className={`
                      w-full px-3 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50
                      border-b border-gray-100 last:border-b-0 cursor-pointer
                      ${selectedAbilityData?.name === ability.name ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ability.isSpecial && getSpecialTypeIcon(ability.specialType)}
                          <span className="font-medium truncate">{ability.name}</span>
                          {ability.isSpecial && getSpecialTypeBadge(ability.specialType)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{ability.text}</p>
                        {ability.isSpecial && ability.specialConfig && (
                          <div className="mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              <span>效果: {ability.specialConfig.效果}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 选中特性的详细信息 */}
      {selectedAbilityData && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {selectedAbilityData.isSpecial && getSpecialTypeIcon(selectedAbilityData.specialType)}
                <h4 className="font-medium text-gray-900">{selectedAbilityData.name}</h4>
                {selectedAbilityData.isSpecial && getSpecialTypeBadge(selectedAbilityData.specialType)}
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{selectedAbilityData.text}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">普通特性数量:</span> {selectedAbilityData.common_count}
                </div>
                <div>
                  <span className="font-medium">隐藏特性数量:</span> {selectedAbilityData.hidden_count}
                </div>
              </div>

              {selectedAbilityData.isSpecial && selectedAbilityData.specialConfig && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <h5 className="font-medium text-gray-900 mb-2">特殊效果详情</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">效果:</span> {selectedAbilityData.specialConfig.效果}
                    </div>
                    <div>
                      <span className="font-medium">触发条件:</span> {selectedAbilityData.specialConfig.触发条件}
                    </div>
                    <div>
                      <span className="font-medium">备注:</span> {selectedAbilityData.specialConfig.备注}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}