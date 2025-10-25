'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { PokemonIndexEntry, PokemonWithStats, searchPokemon, searchPokemonWithStats } from '@/utils/pokemonDataParser';

interface PokemonSelectorProps {
  value?: PokemonWithStats | null;
  onChange: (pokemon: PokemonWithStats | null) => void;
  placeholder?: string;
  disabled?: boolean;
  pokemonList: PokemonWithStats[];
}

export default function PokemonSelector({
  value,
  onChange,
  placeholder = '选择宝可梦...',
  disabled = false,
  pokemonList
}: PokemonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonWithStats[]>(pokemonList);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredPokemon(searchPokemonWithStats(pokemonList, searchQuery));
  }, [searchQuery, pokemonList]);

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

  const handleSelect = (pokemon: PokemonWithStats) => {
    onChange(pokemon);
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
            <img
              src={value.imageUrl}
              alt={value.chinese}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/thumbnails/default.png';
              }}
            />
            <span className="text-gray-900 dark:text-gray-100">{value.chinese}</span>
            <span className="text-sm text-gray-500">#{value.id.toString().padStart(3, '0')}</span>
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
                  placeholder="搜索宝可梦..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredPokemon.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                未找到匹配的宝可梦
              </div>
            ) : (
              filteredPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  onClick={() => handleSelect(pokemon)}
                  className="flex items-center space-x-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-300 group rounded-lg mx-2 mb-2 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50"
                >
                  <div className="relative">
                    <div className="relative w-12 h-12 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-white/50 dark:border-gray-500/50">
                      <img
                        src={pokemon.imageUrl}
                        alt={pokemon.chinese}
                        className="w-full h-full object-contain transition-all duration-300 transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/thumbnails/default.png';
                        }}
                      />
                    </div>
                    
                    {/* 编号徽章 */}
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                      #{pokemon.id.toString().padStart(3, '0')}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {pokemon.chinese}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {pokemon.english}
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