'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { MoveData, searchMoves } from '@/utils/pokemonDataParser';

interface MoveSelectorProps {
  value?: MoveData | null;
  onChange: (move: MoveData | null) => void;
  placeholder?: string;
  disabled?: boolean;
  moves: MoveData[];
}

// 属性类型颜色映射
const typeColors: { [key: string]: string } = {
  'Normal': 'bg-gray-400',
  'Fire': 'bg-red-500',
  'Water': 'bg-blue-500',
  'Electric': 'bg-yellow-400',
  'Grass': 'bg-green-500',
  'Ice': 'bg-blue-300',
  'Fighting': 'bg-red-700',
  'Poison': 'bg-purple-500',
  'Ground': 'bg-yellow-600',
  'Flying': 'bg-indigo-400',
  'Psychic': 'bg-pink-500',
  'Bug': 'bg-green-400',
  'Rock': 'bg-yellow-800',
  'Ghost': 'bg-purple-700',
  'Dragon': 'bg-indigo-700',
  'Dark': 'bg-gray-800',
  'Steel': 'bg-gray-500',
  'Fairy': 'bg-pink-300'
};

// 技能分类颜色
const categoryColors: { [key: string]: string } = {
  '物理': 'text-red-600 bg-red-100',
  '特殊': 'text-blue-600 bg-blue-100',
  '变化': 'text-gray-600 bg-gray-100'
};

export default function MoveSelector({
  value,
  onChange,
  placeholder = '选择技能...',
  disabled = false,
  moves
}: MoveSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMoves, setFilteredMoves] = useState<MoveData[]>(moves);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredMoves(searchMoves(moves, searchQuery));
  }, [searchQuery, moves]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (move: MoveData) => {
    onChange(move);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const getTypeColor = (type: string) => {
    return typeColors[type] || 'bg-gray-400';
  };

  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`relative flex items-center border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            : 'hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        } ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 dark:border-gray-600'
        }`}
        onClick={handleInputFocus}
      >
        {value ? (
          <div className="flex items-center space-x-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getTypeColor(value.type)}`}>
              <span className="text-xs font-bold text-white">{value.type.slice(0, 2)}</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100">{value.cname}</span>
            <span className={`text-xs px-2 py-1 rounded ${getCategoryStyle(value.category)}`}>
              {value.category}
            </span>
            {value.power > 0 && (
              <span className="text-sm text-gray-500">威力{value.power}</span>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
            onFocus={() => setIsOpen(true)}
          />
        )}
        
        <div className="flex items-center space-x-1">
          {value && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {!value && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索技能..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredMoves.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                未找到匹配的技能
              </div>
            ) : (
              filteredMoves.map((move) => (
                <div
                  key={move.id}
                  onClick={() => handleSelect(move)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(move.type)}`}>
                      <span className="text-xs font-bold text-white">{move.type.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {move.cname}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getCategoryStyle(move.category)}`}>
                          {move.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {move.ename} • 
                        {move.power > 0 && `威力${move.power} • `}
                        命中率{move.accuracy}% • PP{move.pp}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}