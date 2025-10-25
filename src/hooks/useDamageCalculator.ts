/**
 * Damage Calculator Hook
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Pokemon,
  Move,
  DamageResult,
  DamageStatistics,
  PokemonDamageCalculator,
  NATURE_MODIFIERS
} from '@/lib/pokemonDamageCalculator';
import { 
  CalculatorPokemonState, 
  MoveInfo, 
  ExtendedDamageResult,
  DirectionalDamageResult,
  SingleMoveResult,
  DamageCalculatorState,
  PokemonTemplate,
  DEFAULT_POKEMON_STATE,
  DEFAULT_BATTLE_CONDITIONS,
  DebugInfo,
  NatureModifiers,
  FinalStats,
  CalculationEquation
} from '@/types/pokemonCalculator';
import { MoveData } from '@/utils/pokemonDataParser';

// 创建 TypeScript 计算器实例
const damageCalculator = new PokemonDamageCalculator();

// 生成调试信息
function generateDebugInfo(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  result: any,
  randomFactor?: number
): DebugInfo {
  // 获取性格修正数据
  const attackerNature = attacker.nature ? NATURE_MODIFIERS[attacker.nature] : null;
  const defenderNature = defender.nature ? NATURE_MODIFIERS[defender.nature] : null;
  
  const attackerNatureModifiers: NatureModifiers = {
    attack: attackerNature?.attack || 1.0,
    defense: attackerNature?.defense || 1.0,
    spAttack: attackerNature?.spAttack || 1.0,
    spDefense: attackerNature?.spDefense || 1.0,
    speed: attackerNature?.speed || 1.0
  };

  const defenderNatureModifiers: NatureModifiers = {
    attack: defenderNature?.attack || 1.0,
    defense: defenderNature?.defense || 1.0,
    spAttack: defenderNature?.spAttack || 1.0,
    spDefense: defenderNature?.spDefense || 1.0,
    speed: defenderNature?.speed || 1.0
  };

  // 计算最终能力值
  const calculateFinalStat = (baseStat: number, iv: number, ev: number, level: number, natureModifier: number): number => {
    return Math.floor(((baseStat * 2 + iv + Math.floor(ev / 4)) * level / 100 + 5) * natureModifier);
  };

  const calculateFinalHP = (baseStat: number, iv: number, ev: number, level: number): number => {
    return Math.floor((baseStat * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
  };

  const attackerFinalStats: FinalStats = {
    hp: calculateFinalHP(attacker.baseStats?.HP || 100, attacker.ivs?.HP || 31, attacker.evs?.HP || 0, attacker.level || 50),
    attack: calculateFinalStat(attacker.baseStats?.Attack || 100, attacker.ivs?.Attack || 31, attacker.evs?.Attack || 0, attacker.level || 50, attackerNatureModifiers.attack),
    defense: calculateFinalStat(attacker.baseStats?.Defense || 100, attacker.ivs?.Defense || 31, attacker.evs?.Defense || 0, attacker.level || 50, attackerNatureModifiers.defense),
    spAttack: calculateFinalStat(attacker.baseStats?.['Sp. Attack'] || 100, attacker.ivs?.['Sp. Attack'] || 31, attacker.evs?.['Sp. Attack'] || 0, attacker.level || 50, attackerNatureModifiers.spAttack),
    spDefense: calculateFinalStat(attacker.baseStats?.['Sp. Defense'] || 100, attacker.ivs?.['Sp. Defense'] || 31, attacker.evs?.['Sp. Defense'] || 0, attacker.level || 50, attackerNatureModifiers.spDefense),
    speed: calculateFinalStat(attacker.baseStats?.Speed || 100, attacker.ivs?.Speed || 31, attacker.evs?.Speed || 0, attacker.level || 50, attackerNatureModifiers.speed)
  };

  const defenderFinalStats: FinalStats = {
    hp: calculateFinalHP(defender.baseStats?.HP || 100, defender.ivs?.HP || 31, defender.evs?.HP || 0, defender.level || 50),
    attack: calculateFinalStat(defender.baseStats?.Attack || 100, defender.ivs?.Attack || 31, defender.evs?.Attack || 0, defender.level || 50, defenderNatureModifiers.attack),
    defense: calculateFinalStat(defender.baseStats?.Defense || 100, defender.ivs?.Defense || 31, defender.evs?.Defense || 0, defender.level || 50, defenderNatureModifiers.defense),
    spAttack: calculateFinalStat(defender.baseStats?.['Sp. Attack'] || 100, defender.ivs?.['Sp. Attack'] || 31, defender.evs?.['Sp. Attack'] || 0, defender.level || 50, defenderNatureModifiers.spAttack),
    spDefense: calculateFinalStat(defender.baseStats?.['Sp. Defense'] || 100, defender.ivs?.['Sp. Defense'] || 31, defender.evs?.['Sp. Defense'] || 0, defender.level || 50, defenderNatureModifiers.spDefense),
    speed: calculateFinalStat(defender.baseStats?.Speed || 100, defender.ivs?.Speed || 31, defender.evs?.Speed || 0, defender.level || 50, defenderNatureModifiers.speed)
  };

  // 获取修正倍率
  const modifiers = result.modifiers || result.multipliers || {};
  
  // 生成计算等式
  const attackStat = move.category === '物理' ? attackerFinalStats.attack : attackerFinalStats.spAttack;
  const defenseStat = move.category === '物理' ? defenderFinalStats.defense : defenderFinalStats.spDefense;
  
  const baseDamageEquation: CalculationEquation = {
    step: "基础伤害计算",
    formula: "((2 × 等级 + 10) ÷ 250) × (攻击力 ÷ 防御力) × 威力 + 2",
    values: {
      level: attacker.level || 50,
      attack: attackStat,
      defense: defenseStat,
      power: move.power || 0
    },
    result: result.base_damage || 0
  };

  const finalDamageEquation: CalculationEquation = {
    step: "最终伤害计算",
    formula: "基础伤害 × STAB × 属性相克 × 会心 × 随机因子 × 其他修正",
    values: {
      baseDamage: result.base_damage || 0,
      stab: modifiers.stab || 1.0,
      typeEffectiveness: modifiers.type || 1.0,
      critical: modifiers.critical || 1.0,
      random: randomFactor || modifiers.random || 1.0,
      other: modifiers.other || 1.0
    },
    result: result.damage || 0
  };

  return {
    attackerNature: attackerNatureModifiers,
    defenderNature: defenderNatureModifiers,
    attackerNatureModifiers,
    defenderNatureModifiers,
    randomFactor: randomFactor || modifiers.random || 1.0,
    weatherEffect: {
      name: '',
      multiplier: modifiers.weather || 1.0,
      description: ''
    },
    terrainEffect: {
      name: '',
      multiplier: modifiers.terrain || 1.0,
      description: ''
    },
    typeEffectiveness: {
      attackType: move.type,
      defenderTypes: defender.types,
      multiplier: modifiers.type || 1.0,
      effectiveness: modifiers.type > 1 ? '超级有效' : modifiers.type < 1 ? '不很有效' : '有效'
    },
    attackerIVs: {
      HP: attacker.ivs?.HP ?? 31,
      Attack: attacker.ivs?.Attack ?? 31,
      Defense: attacker.ivs?.Defense ?? 31,
      'Sp. Attack': attacker.ivs?.['Sp. Attack'] ?? 31,
      'Sp. Defense': attacker.ivs?.['Sp. Defense'] ?? 31,
      Speed: attacker.ivs?.Speed ?? 31
    },
    defenderIVs: {
      HP: defender.ivs?.HP ?? 31,
      Attack: defender.ivs?.Attack ?? 31,
      Defense: defender.ivs?.Defense ?? 31,
      'Sp. Attack': defender.ivs?.['Sp. Attack'] ?? 31,
      'Sp. Defense': defender.ivs?.['Sp. Defense'] ?? 31,
      Speed: defender.ivs?.Speed ?? 31
    },
    attackerEVs: {
      HP: attacker.evs?.HP ?? 0,
      Attack: attacker.evs?.Attack ?? 0,
      Defense: attacker.evs?.Defense ?? 0,
      'Sp. Attack': attacker.evs?.['Sp. Attack'] ?? 0,
      'Sp. Defense': attacker.evs?.['Sp. Defense'] ?? 0,
      Speed: attacker.evs?.Speed ?? 0
    },
    defenderEVs: {
      HP: defender.evs?.HP ?? 0,
      Attack: defender.evs?.Attack ?? 0,
      Defense: defender.evs?.Defense ?? 0,
      'Sp. Attack': defender.evs?.['Sp. Attack'] ?? 0,
      'Sp. Defense': defender.evs?.['Sp. Defense'] ?? 0,
      Speed: defender.evs?.Speed ?? 0
    },
    attackerFinalStats,
    defenderFinalStats,
    calculationEquations: [],
    baseDamageFormula: {
      level: attacker.level || 50,
      power: move.power,
      attack: attackerFinalStats.attack,
      defense: defenderFinalStats.defense,
      result: result.base_damage || 0,
      formula: '((2 × Level + 10) ÷ 250) × (Attack ÷ Defense) × Power + 2'
    }
  };
}

// 使用 TypeScript 计算器计算伤害
function calculateDamageWithTypeScript(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  criticalHit: boolean = false,
  randomFactor?: number
): DamageResult {
  return damageCalculator.calculateDamageDirect(
    attacker,
    defender,
    move,
    criticalHit,
    randomFactor
  );
}

// 使用 TypeScript 计算器计算伤害范围
function calculateDamageRangeWithTypeScript(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  criticalHit: boolean = false
): number[] {
  return damageCalculator.calculateDamageRange(
    attacker,
    defender,
    move,
    criticalHit
  );
}

// 使用 TypeScript 计算器获取伤害统计
function getDamageStatisticsWithTypeScript(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  criticalHit: boolean = false
): DamageStatistics {
  return damageCalculator.getDamageStatistics(
    attacker,
    defender,
    move,
    criticalHit
  );
}

export function useDamageCalculator() {
  // Calculator state
  const [state, setState] = useState<DamageCalculatorState>({
    attacker: { ...DEFAULT_POKEMON_STATE },
    defender: { ...DEFAULT_POKEMON_STATE },
    battleConditions: { ...DEFAULT_BATTLE_CONDITIONS }
  });

  const [result, setResult] = useState<ExtendedDamageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movesData, setMovesData] = useState<MoveData[]>([]);

  // Load moves data from API
  const loadMovesData = useCallback(async () => {
    try {
      console.log('Loading moves data from API...');
      const response = await fetch('/api/static-data/moves?limit=1000'); // 获取更多数据
      if (response.ok) {
        const data = await response.json();
        console.log('API response structure:', data);
        console.log('API response data array length:', data.data?.length);
        
        // 转换API数据格式为MoveData格式
        const movesData = (data.data || []).map((move: any) => {
          console.log('Processing move:', move);
          
          // 处理names字段 - 可能是对象或者直接在move上
          let cname = '';
          let ename = '';
          let jname = '';
          
          if (move.names && typeof move.names === 'object') {
            cname = move.names.chinese || '';
            ename = move.names.english || '';
            jname = move.names.japanese || '';
          } else {
            // 如果没有names对象，使用move.name作为中文名
            cname = move.name || '';
          }
          
          const convertedMove = {
            id: move.id,
            cname: cname,
            ename: ename,
            jname: jname,
            type: move.type,
            category: move.category,
            power: move.power ?? 0, // 确保power不为null，如果为null则设为0
            accuracy: move.accuracy ?? 0, // 确保accuracy不为null，如果为null则设为0
            pp: move.pp ?? 0 // 确保pp不为null，如果为null则设为0
          };
          
          // 特别记录百万吨拳击的数据
          if (cname === '百万吨拳击' || ename === 'Mega Punch' || move.name === '百万吨拳击') {
            console.log('Found Mega Punch data:', convertedMove);
            console.log('Original move data:', move);
          }
          
          return convertedMove;
        });
        
        setMovesData(movesData);
        console.log('Loaded moves data:', movesData.length, 'moves');
        
        // 验证百万吨拳击数据
        const megaPunch = movesData.find(move => 
          move.cname === '百万吨拳击' || move.ename === 'Mega Punch'
        );
        if (megaPunch) {
          console.log('Mega Punch in movesData:', megaPunch);
        } else {
          console.log('Mega Punch not found in movesData');
          // 显示前几个招式的数据用于调试
          console.log('First 3 moves:', movesData.slice(0, 3));
        }
      } else {
        console.error('Failed to fetch moves data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load moves data:', error);
    }
  }, []);

  // Get move data by name (supports Chinese, English, Japanese names)
  const getMoveDataByName = useCallback((moveName: string): Partial<MoveData> | null => {
    if (!movesData.length) {
      console.log('No moves data loaded yet, returning null for:', moveName);
      return null;
    }
    
    console.log(`Looking for move data for: "${moveName}"`);
    
    const move = movesData.find(move => 
      move.cname === moveName || 
      move.ename === moveName || 
      move.jname === moveName
    );
    
    if (move) {
      console.log(`Found move data for "${moveName}":`, move);
    } else {
      console.log(`No move data found for "${moveName}"`);
      // 显示一些可能的匹配项用于调试
      const possibleMatches = movesData.filter(m => 
        m.cname?.includes(moveName) || 
        m.ename?.includes(moveName) || 
        moveName.includes(m.cname || '') ||
        moveName.includes(m.ename || '')
      ).slice(0, 3);
      if (possibleMatches.length > 0) {
        console.log('Possible matches:', possibleMatches.map(m => ({ cname: m.cname, ename: m.ename })));
      }
    }
    
    return move || null;
  }, [movesData]);

  // Load moves data on component mount
  useEffect(() => {
    loadMovesData();
  }, [loadMovesData]);

  // Convert CalculatorPokemonState to Pokemon type
  const convertToPokemon = useCallback((pokemonState: CalculatorPokemonState): Pokemon => {
    console.log('Converting Pokemon data:', pokemonState);
    return {
      id: pokemonState.id || 0,
      name: pokemonState.name,
      types: pokemonState.types,
      baseStats: pokemonState.baseStats,
      level: pokemonState.level,
      nature: pokemonState.nature,
      ability: pokemonState.ability,
      item: pokemonState.item,
      status: pokemonState.status,
      weather: pokemonState.weather,
      screens: pokemonState.screens,
      assistStatus: pokemonState.assistStatus,
      ivs: pokemonState.ivs,
      evs: pokemonState.evs
    };
  }, []);

  // Convert MoveInfo to Move type
  const convertToMove = useCallback((moveInfo: MoveInfo): Move => {
    console.log('Converting move data:', moveInfo);
    return {
      id: moveInfo.id,
      name: moveInfo.name,
      power: moveInfo.power,
      type: moveInfo.type,
      category: moveInfo.category,
      accuracy: moveInfo.accuracy
    };
  }, []);

  // Update attacker
  const updateAttacker = useCallback((updates: Partial<CalculatorPokemonState>) => {
    console.log('Updating attacker data:', updates);
    setState(prev => ({
      ...prev,
      attacker: { ...prev.attacker, ...updates }
    }));
    setError(null);
  }, []);

  // Update defender
  const updateDefender = useCallback((updates: Partial<CalculatorPokemonState>) => {
    console.log('Updating defender data:', updates);
    setState(prev => ({
      ...prev,
      defender: { ...prev.defender, ...updates }
    }));
    setError(null);
  }, []);

  // Get moves list for a specific Pokemon
  const getPokemonMoves = useCallback((pokemon: CalculatorPokemonState, pokemonName: string): MoveInfo[] => {
    console.log(`Getting ${pokemonName} moves list:`, pokemon.moves);
    
    if (pokemon.moves && pokemon.moves.length > 0) {
      // If it's an object array (from template data)
      if (typeof pokemon.moves[0] === 'object' && 'moveName' in pokemon.moves[0]) {
        const convertedMoves = pokemon.moves.map((move: any, index: number) => {
          const moveData = getMoveDataByName(move.moveName);
          
          // 如果没有找到招式数据，记录错误并跳过
          if (!moveData) {
            console.error(`Move data not found for: ${move.moveName}`);
            return null;
          }
          
          return {
            id: move.moveId || moveData.id || index + 1,
            name: move.moveName || moveData.cname || moveData.ename || `Move${index + 1}`,
            power: move.movePower !== undefined ? move.movePower : moveData.power,
            type: move.moveType || moveData.type || 'Normal',
            category: (move.moveCategory === 'Physical' ? '物理' : move.moveCategory === 'Special' ? '特殊' : 
                      moveData.category === '物理' ? '物理' : moveData.category === '特殊' ? '特殊' : '物理') as '物理' | '特殊',
            accuracy: move.moveAccuracy !== undefined ? move.moveAccuracy : moveData.accuracy
          };
        }).filter(move => move !== null); // 过滤掉null值
        
        console.log(`Converted ${pokemonName} moves list:`, convertedMoves);
        return convertedMoves;
      }
      
      // If it's a string array
      const stringMoves = pokemon.moves.map((moveName: string, index: number) => {
        const moveData = getMoveDataByName(moveName);
        
        // 如果没有找到招式数据，记录错误并跳过
        if (!moveData) {
          console.error(`Move data not found for: ${moveName}`);
          return null;
        }
        
        return {
          id: moveData.id || index + 1,
          name: moveName,
          power: moveData.power ?? 0,
          type: moveData.type || 'Normal',
          category: (moveData.category === '物理' ? '物理' : moveData.category === '特殊' ? '特殊' : '物理') as '物理' | '特殊',
          accuracy: moveData.accuracy ?? 100
        };
      }).filter(move => move !== null); // 过滤掉null值
      
      console.log(`String moves conversion result for ${pokemonName}:`, stringMoves);
      return stringMoves;
    }
    
    // 如果没有招式数据，返回空数组而不是默认招式
    console.warn(`No moves data available for ${pokemonName}, returning empty array`);
    return [];
  }, [getMoveDataByName]);

  // Get attacker moves list (for backward compatibility)
  const getAttackerMoves = useCallback((): MoveInfo[] => {
    return getPokemonMoves(state.attacker, 'Pokemon A');
  }, [state.attacker, getPokemonMoves]);

  // Get defender moves list
  const getDefenderMoves = useCallback((): MoveInfo[] => {
    return getPokemonMoves(state.defender, 'Pokemon B');
  }, [state.defender, getPokemonMoves]);

  // Get moves by name array (for PokemonPanel component)
  const getMovesByNames = useCallback((moveNames: string[]): MoveInfo[] => {
    console.log('Getting moves by names:', moveNames);
    
    const moves = moveNames.map((moveName: string, index: number) => {
      const moveData = getMoveDataByName(moveName);
      
      // 如果没有找到招式数据，记录错误并跳过
      if (!moveData) {
        console.error(`Move data not found for: ${moveName}`);
        return null;
      }
      
      return {
        id: moveData.id || index + 1,
        name: moveName,
        power: moveData.power ?? 0,
        type: moveData.type || 'Normal',
        category: (moveData.category === '物理' ? '物理' : moveData.category === '特殊' ? '特殊' : '物理') as '物理' | '特殊',
        accuracy: moveData.accuracy ?? 100
      };
    }).filter(move => move !== null); // 过滤掉null值
    
    console.log('Converted moves by names:', moves);
    return moves;
  }, [getMoveDataByName]);

  // Update battle conditions
  const updateBattleConditions = useCallback((conditions: Partial<DamageCalculatorState['battleConditions']>) => {
    console.log('Updating battle conditions:', conditions);
    setState(prev => ({
      ...prev,
      battleConditions: { ...prev.battleConditions, ...conditions }
    }));
    setError(null);
  }, []);

  // Calculate damage result for one direction
  const calculateDirectionalDamage = useCallback((
    attacker: CalculatorPokemonState,
    defender: CalculatorPokemonState,
    attackerMoves: MoveInfo[],
    attackerName: string,
    defenderName: string
  ): DirectionalDamageResult => {
    console.log(`Calculating damage from ${attackerName} to ${defenderName}...`);
    
    // Convert CalculatorPokemonState to Pokemon
    const attackerPokemon: Pokemon = convertToPokemon(attacker);
    const defenderPokemon: Pokemon = convertToPokemon(defender);
    
    console.log(`Converted ${attackerName}:`, attackerPokemon);
    console.log(`Converted ${defenderName}:`, defenderPokemon);

    // Calculate damage for each move
    const moveResults: SingleMoveResult[] = attackerMoves.map((moveInfo) => {
      // Convert MoveInfo to Move
      const move: Move = {
        id: moveInfo.id,
        name: moveInfo.name,
        power: moveInfo.power,
        type: moveInfo.type,
        category: moveInfo.category,
        accuracy: moveInfo.accuracy
      };

      console.log(`Calculating damage for move:`, move);

      // Calculate damage using TypeScript calculator
      const damageResult = calculateDamageWithTypeScript(
        attackerPokemon,
        defenderPokemon,
        move,
        state.battleConditions.criticalHit,
        state.battleConditions.randomFactor
      );
      const damageRange = calculateDamageRangeWithTypeScript(attackerPokemon, defenderPokemon, move, state.battleConditions.criticalHit);
      const damageStats = getDamageStatisticsWithTypeScript(attackerPokemon, defenderPokemon, move, state.battleConditions.criticalHit);

      console.log('Damage calculation results:', { damageResult, damageRange, damageStats });

      // Calculate defender max HP
      const defenderMaxHP = defenderPokemon.baseStats?.HP || 100;
      
      // Calculate damage percentage with validation
      const minDamage = damageRange.length > 0 ? Math.min(...damageRange) : 0;
      const maxDamage = damageRange.length > 0 ? Math.max(...damageRange) : 0;
      const averageDamage = damageResult.damage || 0;

      // Calculate defender max HP using the calculator's stats calculation
      const defenderStats = damageCalculator.calculateStats(defenderPokemon);
      const validDefenderMaxHP = defenderStats.HP;

      const minPercentage = Math.round((minDamage / validDefenderMaxHP) * 100);
      const maxPercentage = Math.round((maxDamage / validDefenderMaxHP) * 100);
      const averagePercentage = Math.round((averageDamage / validDefenderMaxHP) * 100);

      // Use damage statistics from the calculator
      const ohkoProbability = damageStats.ohkoChance;
      const twoHitKoProbability = damageStats.twoHkoChance;

      // Generate debug information
      const debugInfo = generateDebugInfo(
        attackerPokemon,
        defenderPokemon,
        move,
        damageResult,
        state.battleConditions.randomFactor
      );

      return {
        move: moveInfo,
        damage: damageResult.damage,
        baseDamage: damageResult.baseDamage,
        damageRange: damageRange,
        percentage: {
          min: minPercentage,
          average: averagePercentage,
          max: maxPercentage
        },
        koChance: {
          ohko: ohkoProbability,
          '2hko': twoHitKoProbability
        },
        modifiers: damageResult.modifiers,
        calculationSteps: damageResult.calculationSteps,
        statsUsed: damageResult.statsUsed,
        itemsUsed: damageResult.itemsUsed,
        debugInfo: debugInfo
      };
    });

    return {
      moves: moveResults,
      attackerName: attackerName,
      defenderName: defenderName
    };
  }, [state.battleConditions, convertToPokemon]);

  // Calculate damage result (bidirectional)
  const calculateDamageResult = useCallback(() => {
    console.log('Starting bidirectional damage calculation...');
    console.log('Current state:', state);
    
    // Detailed data validation
    if (!state.attacker.name || state.attacker.name.trim() === '') {
      const errorMsg = 'Please set attacker Pokemon name';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!state.defender.name || state.defender.name.trim() === '') {
      const errorMsg = 'Please set defender Pokemon name';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!state.attacker.baseStats) {
      const errorMsg = 'Attacker Pokemon missing base stats';
      console.error(errorMsg, state.attacker);
      setError(errorMsg);
      return;
    }

    if (!state.defender.baseStats) {
      const errorMsg = 'Defender Pokemon missing base stats';
      console.error(errorMsg, state.defender);
      setError(errorMsg);
      return;
    }

    // Validate base stats completeness
    const requiredStats = ['HP', 'Attack', 'Defense', 'Sp. Attack', 'Sp. Defense', 'Speed'];
    for (const stat of requiredStats) {
      if (typeof state.attacker.baseStats[stat] !== 'number' || state.attacker.baseStats[stat] <= 0) {
        const errorMsg = `Attacker Pokemon ${stat} data invalid: ${state.attacker.baseStats[stat]}`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      if (typeof state.defender.baseStats[stat] !== 'number' || state.defender.baseStats[stat] <= 0) {
        const errorMsg = `Defender Pokemon ${stat} data invalid: ${state.defender.baseStats[stat]}`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    console.log('Validation passed, starting calculation...');

    try {
      // Get moves for both Pokemon
      const pokemonAMoves = getAttackerMoves();
      const pokemonBMoves = getDefenderMoves();
      
      console.log('Pokemon A moves for calculation:', pokemonAMoves);
      console.log('Pokemon B moves for calculation:', pokemonBMoves);

      // Calculate Pokemon A to Pokemon B damage
      const pokemonAToB = calculateDirectionalDamage(
        state.attacker,
        state.defender,
        pokemonAMoves,
        state.attacker.name,
        state.defender.name
      );

      // Calculate Pokemon B to Pokemon A damage
      const pokemonBToA = calculateDirectionalDamage(
        state.defender,
        state.attacker,
        pokemonBMoves,
        state.defender.name,
        state.attacker.name
      );

      const extendedResult: ExtendedDamageResult = {
        pokemonAToB: pokemonAToB,
        pokemonBToA: pokemonBToA,
        pokemonAName: state.attacker.name,
        pokemonBName: state.defender.name
      };

      console.log('Final bidirectional damage calculation result:', extendedResult);
      setResult(extendedResult);
      console.log('Calculation completed, result set');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during calculation';
      console.error('Damage calculation error:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('Calculation process ended');
    }
  }, [state, getAttackerMoves, getDefenderMoves, calculateDirectionalDamage]);

  // Reset calculator
  const resetCalculator = useCallback(() => {
    console.log('Resetting calculator');
    setState({
      attacker: { ...DEFAULT_POKEMON_STATE },
      defender: { ...DEFAULT_POKEMON_STATE },
      battleConditions: { ...DEFAULT_BATTLE_CONDITIONS }
    });
    setResult(null);
    setError(null);
  }, []);

  // Reset single Pokemon
  const resetPokemon = useCallback((target: 'attacker' | 'defender') => {
    console.log('Resetting Pokemon:', target);
    setState(prev => ({
      ...prev,
      [target]: { ...DEFAULT_POKEMON_STATE }
    }));
    setResult(null);
    setError(null);
  }, []);

  // Check if calculation is possible
  const canCalculate = useMemo(() => {
    const canCalc = !!(
      state.attacker.name &&
      state.attacker.name.trim() !== '' &&
      state.attacker.baseStats &&
      state.defender.name &&
      state.defender.name.trim() !== '' &&
      state.defender.baseStats &&
      // Validate base stats validity
      Object.values(state.attacker.baseStats).every(val => typeof val === 'number' && val > 0) &&
      Object.values(state.defender.baseStats).every(val => typeof val === 'number' && val > 0)
    );
    
    console.log('canCalculate check:', {
      attackerName: state.attacker.name,
      defenderName: state.defender.name,
      attackerBaseStats: state.attacker.baseStats,
      defenderBaseStats: state.defender.baseStats,
      canCalculate: canCalc
    });
    
    return canCalc;
  }, [state]);

  // Load template method
  const loadTemplate = useCallback((template: any, target: 'attacker' | 'defender') => {
    console.log('Loading template:', template, 'for target:', target);
    
    try {
      // Validate template data
      if (!template) {
        console.error('Template is null or undefined');
        setError('模板加载失败: 模板数据为空');
        return;
      }

      // Handle different template data structures
      // Check if it's a PokemonTemplate (with configuration object) or database template (flat structure)
      const isStructuredTemplate = template.configuration && template.stats;
      
      let pokemonState: CalculatorPokemonState;
      
      if (isStructuredTemplate) {
        // Handle PokemonTemplate structure
        pokemonState = {
          id: template.pokemon?.id || 0,
          name: template.pokemon?.name || '',
          level: template.configuration?.level || 50,
          nature: template.configuration?.nature || '',
          ability: template.configuration?.ability?.name || template.configuration?.ability || '',
          item: template.configuration?.item || '',
          types: template.pokemon?.types || [],
          
          // Base stats - use from pokemon data or defaults
          baseStats: template.pokemon?.baseStats || {
            HP: 100,
            Attack: 100,
            Defense: 100,
            'Sp. Attack': 100,
            'Sp. Defense': 100,
            Speed: 100,
          },
          
          // EVs from template stats
          evs: {
            HP: template.stats?.evs?.hp || 0,
            Attack: template.stats?.evs?.attack || 0,
            Defense: template.stats?.evs?.defense || 0,
            'Sp. Attack': template.stats?.evs?.special_attack || 0,
            'Sp. Defense': template.stats?.evs?.special_defense || 0,
            Speed: template.stats?.evs?.speed || 0,
          },
          
          // IVs from template stats
          ivs: {
            HP: template.stats?.ivs?.hp || 31,
            Attack: template.stats?.ivs?.attack || 31,
            Defense: template.stats?.ivs?.defense || 31,
            'Sp. Attack': template.stats?.ivs?.special_attack || 31,
            'Sp. Defense': template.stats?.ivs?.special_defense || 31,
            Speed: template.stats?.ivs?.speed || 31,
          },
          
          // Moves from configuration
          moves: template.configuration?.moves || []
        };
      } else {
        // Handle database template structure (flat)
        pokemonState = {
          id: template.pokemon?.id || template.pokemonId || 0,
          name: template.pokemon?.nameChinese || template.pokemon?.name || '',
          level: template.level || 50,
          nature: template.nature || '',
          ability: template.ability || '',
          item: template.item || '',
          types: template.pokemon?.types || [],
          
          // Base stats - use from pokemon data or defaults
          baseStats: template.pokemon?.baseStats || {
            HP: 100,
            Attack: 100,
            Defense: 100,
            'Sp. Attack': 100,
            'Sp. Defense': 100,
            Speed: 100,
          },
          
          // EVs - try to get from template or use defaults
          evs: {
            HP: template.evs?.HP || template.evs?.hp || 0,
            Attack: template.evs?.Attack || template.evs?.attack || 0,
            Defense: template.evs?.Defense || template.evs?.defense || 0,
            'Sp. Attack': template.evs?.['Sp. Attack'] || template.evs?.special_attack || 0,
            'Sp. Defense': template.evs?.['Sp. Defense'] || template.evs?.special_defense || 0,
            Speed: template.evs?.Speed || template.evs?.speed || 0,
          },
          
          // IVs - try to get from template or use defaults
          ivs: {
            HP: template.ivs?.HP || template.ivs?.hp || 31,
            Attack: template.ivs?.Attack || template.ivs?.attack || 31,
            Defense: template.ivs?.Defense || template.ivs?.defense || 31,
            'Sp. Attack': template.ivs?.['Sp. Attack'] || template.ivs?.special_attack || 31,
            'Sp. Defense': template.ivs?.['Sp. Defense'] || template.ivs?.special_defense || 31,
            Speed: template.ivs?.Speed || template.ivs?.speed || 31,
          },
          
          // Moves from template
          moves: template.moves || []
        };
      }

      console.log('Converted pokemon state:', pokemonState);

      // Update corresponding Pokemon based on target
      if (target === 'attacker') {
        updateAttacker(pokemonState);
      } else {
        updateDefender(pokemonState);
      }

      console.log('Template loaded successfully for', target);
    } catch (error) {
      console.error('Error loading template:', error);
      setError('模板加载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [updateAttacker, updateDefender]);

  // Export template method
  const exportTemplate = useCallback((target: 'attacker' | 'defender') => {
    const pokemon = target === 'attacker' ? state.attacker : state.defender;
    
    // Create template in PokemonTemplate format
    const template = {
      id: Date.now().toString(),
      metadata: {
        name: `${pokemon.name}模板`,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        generator: 'LuoXue Calculator'
      },
      pokemon: {
        id: pokemon.id || 0,
        name: pokemon.name,
        types: pokemon.types,
        types_chinese: pokemon.types
      },
      configuration: {
        level: pokemon.level,
        nature: pokemon.nature,
        ability: {
          name: pokemon.ability,
          index: '0',
          common_count: 0,
          hidden_count: 0,
          isSpecial: false,
          specialType: 'offensive' as const,
          effect: '',
          trigger_condition: '',
          note: ''
        },
        item: pokemon.item,
        moves: pokemon.moves || []
      },
      stats: {
        evs: {
          hp: pokemon.evs.HP,
          attack: pokemon.evs.Attack,
          defense: pokemon.evs.Defense,
          special_attack: pokemon.evs['Sp. Attack'],
          special_defense: pokemon.evs['Sp. Defense'],
          speed: pokemon.evs.Speed
        },
        ivs: {
          hp: pokemon.ivs.HP,
          attack: pokemon.ivs.Attack,
          defense: pokemon.ivs.Defense,
          special_attack: pokemon.ivs['Sp. Attack'],
          special_defense: pokemon.ivs['Sp. Defense'],
          speed: pokemon.ivs.Speed
        },
        calculated_stats: {
          hp: 0, // Will be calculated
          attack: 0,
          defense: 0,
          special_attack: 0,
          special_defense: 0,
          speed: 0
        }
      },
      settings: {
        is_public: false
      }
    };

    return template;
  }, [state]);

  return {
    // State
    state,
    result,
    isLoading,
    error,
    canCalculate,

    // Update methods
    updateAttacker,
    updateDefender,
    updateBattleConditions,

    // Calculation methods
    calculateDamage: calculateDamageResult,

    // Template methods
    loadTemplate,
    exportTemplate,

    // Reset methods
    resetCalculator,
    resetPokemon,

    // Move methods
    getAttackerMoves,
    getDefenderMoves,
    getMovesByNames
  };
}