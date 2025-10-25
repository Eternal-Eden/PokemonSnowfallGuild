'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Minimize2, Maximize2, Move, ChevronLeft, ChevronRight, Zap, RefreshCw } from 'lucide-react';
import { TeamPokemon } from '@/types/auth';
import { 
  PokemonDamageCalculator, 
  Pokemon, 
  Move as PokemonMove, 
  DamageResult, 
  DamageStatistics,
  Stats,
  NATURE_MODIFIERS 
} from '@/lib/pokemonDamageCalculator';

interface SnowfallToolkitProps {
  teams?: any[];
  currentTeam?: any;
}

interface DamageCalculatorData {
  attacker: {
    pokemon: TeamPokemon | null;
    level: number;
    attack: number;
    hp: number;
    defense: number;
    nature: string;
    ability: string;
    item: string;
  };
  defender: {
    pokemon: TeamPokemon | null;
    level: number;
    attack: number;
    hp: number;
    defense: number;
    nature: string;
    ability: string;
    item: string;
  };
  move: {
    name: string;
    power: number;
    type: string;
    category: 'physical' | 'special';
  };
  conditions: {
    weather: string;
    terrain: string;
    criticalHit: boolean;
    stab: boolean;
  };
}

const SnowfallToolkit: React.FC<SnowfallToolkitProps> = ({ teams = [], currentTeam }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAtEdge, setIsAtEdge] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');
  
  const toolkitRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // 伤害计算器数据
  const [calculatorData, setCalculatorData] = useState<DamageCalculatorData>({
    attacker: {
      pokemon: null,
      level: 50,
      attack: 100,
      hp: 100,
      defense: 100,
      nature: '固执',
      ability: '',
      item: ''
    },
    defender: {
      pokemon: null,
      level: 50,
      attack: 100,
      hp: 100,
      defense: 100,
      nature: '大胆',
      ability: '',
      item: ''
    },
    move: {
      name: '',
      power: 80,
      type: '一般',
      category: 'physical'
    },
    conditions: {
      weather: '无',
      terrain: '无',
      criticalHit: false,
      stab: false
    }
  });

  // 初始化位置和检查是否在边缘
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 400, y: 100 });
    }
  }, []);

  useEffect(() => {
    const checkEdgePosition = () => {
      if (typeof window !== 'undefined') {
        if (position.x <= 10 || position.x >= window.innerWidth - 50) {
          setIsAtEdge(true);
        } else {
          setIsAtEdge(false);
        }
      }
    };

    checkEdgePosition();
  }, [position]);

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = toolkitRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      if (typeof window !== 'undefined') {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 400, newX)),
          y: Math.max(0, Math.min(window.innerHeight - 600, newY))
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 伤害计算结果
  const [damageResult, setDamageResult] = useState<DamageStatistics | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 创建计算器实例
  const calculator = new PokemonDamageCalculator();

  // 一键填入配队数据
  const fillFromTeam = (pokemon: TeamPokemon, role: 'attacker' | 'defender') => {
    setCalculatorData(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        pokemon,
        level: pokemon.level || 50,
        attack: role === 'attacker' ? (pokemon.stats?.attack || 100) : prev[role].attack,
        defense: role === 'defender' ? (pokemon.stats?.defense || 100) : prev[role].defense,
        hp: role === 'defender' ? (pokemon.stats?.hp || 100) : prev[role].hp,
        nature: pokemon.nature || prev[role].nature,
        ability: pokemon.ability || prev[role].ability,
        item: pokemon.item || prev[role].item
      }
    }));
  };

  // 执行伤害计算
  const performCalculation = () => {
    setIsCalculating(true);
    
    try {
      // 构建攻击方宝可梦数据
      const attacker: Pokemon = {
        id: typeof calculatorData.attacker.pokemon?.id === 'string' ? 
          parseInt(calculatorData.attacker.pokemon.id) || 1 : 
          calculatorData.attacker.pokemon?.id || 1,
        name: calculatorData.attacker.pokemon?.name || '未知宝可梦',
        types: calculatorData.attacker.pokemon ? 
          [calculatorData.attacker.pokemon.type1, calculatorData.attacker.pokemon.type2].filter((type): type is string => Boolean(type)) : 
          ['一般'],
        baseStats: calculatorData.attacker.pokemon?.stats ? {
          HP: calculatorData.attacker.pokemon.stats.hp,
          Attack: calculatorData.attacker.pokemon.stats.attack,
          Defense: calculatorData.attacker.pokemon.stats.defense,
          'Sp. Attack': calculatorData.attacker.pokemon.stats.specialAttack,
          'Sp. Defense': calculatorData.attacker.pokemon.stats.spDefense,
          Speed: calculatorData.attacker.pokemon.stats.speed
        } : {
          HP: 100,
          Attack: 100,
          Defense: 100,
          'Sp. Attack': 100,
          'Sp. Defense': 100,
          Speed: 100
        },
        level: calculatorData.attacker.level,
        nature: calculatorData.attacker.nature,
        ability: calculatorData.attacker.ability,
        item: calculatorData.attacker.item,
        weather: calculatorData.conditions.weather === '无' ? undefined : calculatorData.conditions.weather
      };

      // 构建防御方宝可梦数据
      const defender: Pokemon = {
        id: typeof calculatorData.defender.pokemon?.id === 'string' ? 
          parseInt(calculatorData.defender.pokemon.id) || 1 : 
          calculatorData.defender.pokemon?.id || 1,
        name: calculatorData.defender.pokemon?.name || '未知宝可梦',
        types: calculatorData.defender.pokemon ? 
          [calculatorData.defender.pokemon.type1, calculatorData.defender.pokemon.type2].filter((type): type is string => Boolean(type)) : 
          ['一般'],
        baseStats: calculatorData.defender.pokemon?.stats ? {
          HP: calculatorData.defender.pokemon.stats.hp,
          Attack: calculatorData.defender.pokemon.stats.attack,
          Defense: calculatorData.defender.pokemon.stats.defense,
          'Sp. Attack': calculatorData.defender.pokemon.stats.specialAttack,
          'Sp. Defense': calculatorData.defender.pokemon.stats.spDefense,
          Speed: calculatorData.defender.pokemon.stats.speed
        } : {
          HP: 100,
          Attack: 100,
          Defense: 100,
          'Sp. Attack': 100,
          'Sp. Defense': 100,
          Speed: 100
        },
        level: calculatorData.defender.level,
        nature: calculatorData.defender.nature,
        ability: calculatorData.defender.ability,
        item: calculatorData.defender.item
      };

      // 构建招式数据
      const move: PokemonMove = {
        id: 1,
        name: calculatorData.move.name || '撞击',
        power: calculatorData.move.power,
        type: calculatorData.move.type,
        category: calculatorData.move.category === 'physical' ? '物理' : '特殊',
        accuracy: 100
      };

      // 执行计算 - 获取伤害统计信息
      const result = calculator.getDamageStatistics(
        attacker,
        defender,
        move,
        calculatorData.conditions.criticalHit
      );
      
      setDamageResult(result);
    } catch (error) {
      console.error('计算伤害时出错:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // 重置计算器数据
  const resetCalculator = () => {
    setCalculatorData({
      attacker: {
        pokemon: null,
        level: 50,
        attack: 100,
        hp: 100,
        defense: 100,
        nature: '固执',
        ability: '',
        item: ''
      },
      defender: {
        pokemon: null,
        level: 50,
        attack: 100,
        hp: 100,
        defense: 100,
        nature: '大胆',
        ability: '',
        item: ''
      },
      move: {
        name: '',
        power: 80,
        type: '一般',
        category: 'physical'
      },
      conditions: {
        weather: '无',
        terrain: '无',
        criticalHit: false,
        stab: false
      }
    });
    setDamageResult(null);
  };

  // 边缘显示切换按钮
  const EdgeToggle = () => (
    <motion.div
      className="fixed top-1/2 transform -translate-y-1/2 z-50"
      style={{
        left: typeof window !== 'undefined' && position.x <= 10 ? 0 : undefined,
        right: typeof window !== 'undefined' && position.x >= window.innerWidth - 50 ? 0 : undefined
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isAtEdge ? 1 : 0 }}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-r-lg shadow-lg transition-colors"
        style={{
          borderTopLeftRadius: typeof window !== 'undefined' && position.x >= window.innerWidth - 50 ? '0.5rem' : 0,
          borderBottomLeftRadius: typeof window !== 'undefined' && position.x >= window.innerWidth - 50 ? '0.5rem' : 0,
          borderTopRightRadius: position.x <= 10 ? '0.5rem' : 0,
          borderBottomRightRadius: position.x <= 10 ? '0.5rem' : 0
        }}
      >
        {position.x <= 10 ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.div>
  );

  return (
    <>
      {/* 边缘切换按钮 */}
      {isAtEdge && !isVisible && <EdgeToggle />}
      
      {/* 工具集合悬浮窗 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={toolkitRef}
            className="fixed z-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700"
            style={{
              left: position.x,
              top: position.y,
              width: isMinimized ? '300px' : '1200px',
              height: isMinimized ? '60px' : '700px'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onMouseDown={handleMouseDown}
          >
            {/* 标题栏 */}
            <div
              ref={dragRef}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg cursor-move"
            >
              <div className="flex items-center space-x-2">
                <Calculator size={20} />
                <span className="font-medium">落雪实用小工具</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 工具内容 */}
            {!isMinimized && (
              <div className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
                {/* 标签页 */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'calculator'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    伤害计算器
                  </button>
                  {/* 预留其他工具标签 */}
                </div>

                {/* 伤害计算器内容 */}
                {activeTab === 'calculator' && (
                  <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
                    <div className="p-4 min-h-full">
                      {/* 三列布局：攻击方、中间区域、防守方 */}
                      <div className="grid grid-cols-3 gap-4 h-full">
                        {/* 左侧：攻击方 */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                          <div className="text-center mb-3">
                            <h3 className="text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border">精灵选择</h3>
                          </div>
                        
                          {/* 宝可梦选择 */}
                          <div className="mb-3">
                            <select 
                              className="w-full text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                              value={calculatorData.attacker.pokemon?.id || ''}
                              onChange={(e) => {
                                const pokemon = currentTeam?.pokemons?.find((p: any) => p.id === e.target.value);
                                if (pokemon) fillFromTeam(pokemon, 'attacker');
                              }}
                            >
                              <option value="">选择宝可梦</option>
                              {currentTeam?.pokemons?.map((pokemon: any, index: number) => (
                                <option key={index} value={pokemon.id}>
                                  {pokemon.name} Lv.{pokemon.level}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 属性按钮 */}
                          <div className="grid grid-cols-5 gap-1 mb-3">
                            <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性1</button>
                            <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性2</button>
                            <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性3</button>
                            <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">等级</button>
                            <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">性别</button>
                          </div>

                          {/* 种族值表格 */}
                          <div className="mb-3">
                            <div className="text-xs font-bold mb-2 text-center">种族值 个体值 努力值</div>
                            <div className="grid grid-cols-4 gap-1 text-xs">
                              <div className="text-right pr-1">HP</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.attacker.hp} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, hp: parseInt(e.target.value) || 100}}))} />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                              
                              <div className="text-right pr-1">攻击</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.attacker.attack} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, attack: parseInt(e.target.value) || 100}}))} />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                              
                              <div className="text-right pr-1">防御</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.attacker.defense} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, defense: parseInt(e.target.value) || 100}}))} />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                              
                              <div className="text-right pr-1">特攻</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                              
                              <div className="text-right pr-1">特防</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                              
                              <div className="text-right pr-1">速度</div>
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                              <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                          </div>
                            <div className="text-right text-xs mt-1">
                              <span className="mr-2">实际能力</span>
                              <span className="mr-2">努力合计</span>
                            </div>
                          </div>

                          {/* 性格、特性、道具 */}
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs block mb-1">性格</label>
                              <select className="w-full text-xs p-1 border rounded" value={calculatorData.attacker.nature} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, nature: e.target.value}}))}>
                                {Object.keys(NATURE_MODIFIERS).map(nature => (
                                  <option key={nature} value={nature}>{nature}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs block mb-1">特性</label>
                              <input type="text" className="w-full text-xs p-1 border rounded" value={calculatorData.attacker.ability} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, ability: e.target.value}}))} placeholder="特性" />
                            </div>
                            <div>
                              <label className="text-xs block mb-1">道具</label>
                              <input type="text" className="w-full text-xs p-1 border rounded" value={calculatorData.attacker.item} onChange={(e) => setCalculatorData(prev => ({...prev, attacker: {...prev.attacker, item: e.target.value}}))} placeholder="道具" />
                            </div>
                          </div>

                          {/* 技能列表 */}
                          <div className="mt-3">
                            <div className="grid grid-cols-4 gap-1">
                              <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">技能</button>
                              <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">威力</button>
                              <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">命中/PP</button>
                              <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">伤害</button>
                              
                              <input type="text" className="text-xs p-1 border rounded" value={calculatorData.move.name} onChange={(e) => setCalculatorData(prev => ({...prev, move: {...prev.move, name: e.target.value}}))} placeholder="技能" />
                              <input type="number" className="text-xs p-1 border rounded" value={calculatorData.move.power} onChange={(e) => setCalculatorData(prev => ({...prev, move: {...prev.move, power: parseInt(e.target.value) || 80}}))} />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="100/15" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                              
                              <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                              
                              <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                              
                              <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                              <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                            </div>
                          </div>
                        </div>

                        {/* 中间区域：技能伤害 */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                          <div className="text-center mb-3">
                            <h3 className="text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border">技能伤害</h3>
                          </div>
                          
                          {/* 技能选择 */}
                          <div className="space-y-2 mb-4">
                            <div>
                              <label className="text-xs block mb-1">技能</label>
                              <input type="text" className="w-full text-xs p-1 border rounded" placeholder="技能名称" />
                            </div>
                            <div>
                              <label className="text-xs block mb-1">威力</label>
                              <input type="number" className="w-full text-xs p-1 border rounded" placeholder="威力" />
                            </div>
                            <div>
                              <label className="text-xs block mb-1">分类</label>
                              <select className="w-full text-xs p-1 border rounded">
                                <option value="物理">物理</option>
                                <option value="特殊">特殊</option>
                                <option value="变化">变化</option>
                              </select>
                            </div>
                          </div>

                          {/* 战斗条件 */}
                          <div className="space-y-2 mb-4">
                            <div className="text-xs font-bold mb-1">战斗条件</div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={calculatorData.conditions.criticalHit}
                                onChange={(e) => setCalculatorData(prev => ({
                                  ...prev,
                                  conditions: { ...prev.conditions, criticalHit: e.target.checked }
                                }))}
                                className="rounded"
                              />
                              <span className="text-xs">会心一击</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={calculatorData.conditions.stab}
                                onChange={(e) => setCalculatorData(prev => ({
                                  ...prev,
                                  conditions: { ...prev.conditions, stab: e.target.checked }
                                }))}
                                className="rounded"
                              />
                              <span className="text-xs">本系加成</span>
                            </label>
                          </div>

                          {/* 计算按钮 */}
                          <div className="text-center">
                            <button
                              onClick={performCalculation}
                              disabled={isCalculating}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              计算伤害
                            </button>
                          </div>
                        </div>

                      {/* 防守方 */}
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                        <div className="text-center mb-3">
                          <h3 className="text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border">精灵选择</h3>
                        </div>
                        
                        {/* 宝可梦选择 */}
                        <div className="mb-3">
                          <select 
                            className="w-full text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                            value={calculatorData.defender.pokemon?.id || ''}
                            onChange={(e) => {
                              const pokemon = currentTeam?.pokemons?.find((p: any) => p.id === e.target.value);
                              if (pokemon) fillFromTeam(pokemon, 'defender');
                            }}
                          >
                            <option value="">选择宝可梦</option>
                            {currentTeam?.pokemons?.map((pokemon: any, index: number) => (
                              <option key={index} value={pokemon.id}>
                                {pokemon.name} Lv.{pokemon.level}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 属性按钮 */}
                        <div className="grid grid-cols-5 gap-1 mb-3">
                          <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性1</button>
                          <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性2</button>
                          <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">属性3</button>
                          <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">等级</button>
                          <button className="text-xs px-1 py-1 bg-gray-200 dark:bg-gray-600 rounded border">性别</button>
                        </div>

                        {/* 种族值表格 */}
                        <div className="mb-3">
                          <div className="text-xs font-bold mb-2 text-center">种族值 个体值 努力值</div>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <div className="text-right pr-1">HP</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.defender.hp} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, hp: parseInt(e.target.value) || 100}}))} />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                            
                            <div className="text-right pr-1">攻击</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.defender.attack} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, attack: parseInt(e.target.value) || 100}}))} />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                            
                            <div className="text-right pr-1">防御</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" value={calculatorData.defender.defense} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, defense: parseInt(e.target.value) || 100}}))} />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                            
                            <div className="text-right pr-1">特攻</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                            
                            <div className="text-right pr-1">特防</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                            
                            <div className="text-right pr-1">速度</div>
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="100" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="31" />
                            <input type="number" className="w-full p-1 border rounded text-xs" placeholder="0" />
                        </div>
                          <div className="text-right text-xs mt-1">
                            <span className="mr-2">实际能力</span>
                            <span className="mr-2">努力合计</span>
                          </div>
                        </div>

                        {/* 性格、特性、道具 */}
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs block mb-1">性格</label>
                            <select className="w-full text-xs p-1 border rounded" value={calculatorData.defender.nature} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, nature: e.target.value}}))}>
                              {Object.keys(NATURE_MODIFIERS).map(nature => (
                                <option key={nature} value={nature}>{nature}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs block mb-1">特性</label>
                            <input type="text" className="w-full text-xs p-1 border rounded" value={calculatorData.defender.ability} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, ability: e.target.value}}))} placeholder="特性" />
                          </div>
                          <div>
                            <label className="text-xs block mb-1">道具</label>
                            <input type="text" className="w-full text-xs p-1 border rounded" value={calculatorData.defender.item} onChange={(e) => setCalculatorData(prev => ({...prev, defender: {...prev.defender, item: e.target.value}}))} placeholder="道具" />
                          </div>
                        </div>

                        {/* 技能列表 */}
                        <div className="mt-3">
                          <div className="grid grid-cols-4 gap-1">
                            <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">技能</button>
                            <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">威力</button>
                            <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">命中/PP</button>
                            <button className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-700">伤害</button>
                            
                            <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="100/15" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                            
                            <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                            
                            <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                            
                            <input type="text" className="text-xs p-1 border rounded" placeholder="技能" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="威力" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="命中/PP" />
                            <input type="text" className="text-xs p-1 border rounded" placeholder="伤害" />
                          </div>
                        </div>
                      </div>

                      {/* 中间计算区域 */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border h-fit flex flex-col">
                        <div className="text-center mb-3">
                          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">技能伤害</h3>
                        </div>
                        
                        {/* 技能选择 */}
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="text-xs block mb-1">技能</label>
                            <input type="text" className="w-full text-xs p-1 border rounded" placeholder="技能名称" />
                          </div>
                          <div>
                            <label className="text-xs block mb-1">威力</label>
                            <input type="number" className="w-full text-xs p-1 border rounded" placeholder="威力" />
                          </div>
                          <div>
                            <label className="text-xs block mb-1">分类</label>
                            <select className="w-full text-xs p-1 border rounded">
                              <option value="物理">物理</option>
                              <option value="特殊">特殊</option>
                              <option value="变化">变化</option>
                            </select>
                          </div>
                        </div>

                        {/* 战斗条件 */}
                        <div className="space-y-3 mb-4">
                          <div className="text-xs font-bold mb-1">战斗条件</div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={calculatorData.conditions.criticalHit}
                              onChange={(e) => setCalculatorData(prev => ({
                                ...prev,
                                conditions: { ...prev.conditions, criticalHit: e.target.checked }
                              }))}
                              className="rounded"
                            />
                            <span className="text-xs">会心一击</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={calculatorData.conditions.stab}
                              onChange={(e) => setCalculatorData(prev => ({
                                ...prev,
                                conditions: { ...prev.conditions, stab: e.target.checked }
                              }))}
                              className="rounded"
                            />
                            <span className="text-xs">本系加成</span>
                          </label>
                        </div>

                        {/* 计算按钮 */}
                        <div className="text-center">
                          <button
                            onClick={performCalculation}
                            disabled={isCalculating}
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
                          >
                            计算伤害
                          </button>
                        </div>
                      </div>
                      </div>

                      {/* 伤害计算结果 */}
                      <div className="col-span-3 mt-4">
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                          <div className="text-center mb-3">
                            <h3 className="text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border">伤害计算结果</h3>
                          </div>
                          
                          {damageResult ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">最小伤害</div>
                                  <div className="text-lg font-bold text-red-600">{damageResult.minDamage}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">最大伤害</div>
                                  <div className="text-lg font-bold text-red-600">{damageResult.maxDamage}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">平均伤害</div>
                                  <div className="text-lg font-bold text-blue-600">{damageResult.averageDamage}</div>
                                </div>
                              </div>
                              
                              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                                一击必杀概率: {damageResult.ohkoChance.toFixed(1)}% | 二击必杀概率: {damageResult.twoHkoChance.toFixed(1)}%
                              </div>
                              
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={resetCalculator}
                                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                >
                                  重置计算器
                                </button>
                                <button
                                  onClick={() => {
                                    // 保存结果逻辑
                                    console.log('保存计算结果:', damageResult);
                                  }}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                >
                                  保存结果
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              <div className="text-sm">请填写完整信息后点击计算按钮</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全局显示按钮 */}
      {!isVisible && !isAtEdge && (
        <motion.button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Calculator size={24} />
        </motion.button>
      )}
    </>
  );
};

export default SnowfallToolkit;