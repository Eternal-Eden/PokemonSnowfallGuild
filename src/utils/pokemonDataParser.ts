// 宝可梦数据解析工具

export interface PokemonIndexEntry {
  id: number;
  english: string;
  japanese: string;
  chinese: string;
  french: string;
  imageUrl: string;
}

export interface PokemonWithStats extends PokemonIndexEntry {
  base?: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
}

export interface AbilityData {
  index: string;
  name: string;
  name_jp: string;
  name_en: string;
  text: string;
  generation: string;
}

export interface MoveData {
  id: number;
  cname: string;
  ename: string;
  jname: string;
  type: string;
  category: string;
  power: number;
  accuracy: number;
  pp: number;
}

// 解析宝可梦名称索引
export async function parsePokemonIndex(): Promise<PokemonIndexEntry[]> {
  try {
    const response = await fetch('/index.txt');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const pokemonList: PokemonIndexEntry[] = [];
    
    for (const line of lines) {
      const match = line.match(/\{'english': '([^']+)', 'japanese': '([^']+)', 'chinese': '([^']+)', 'french': '([^']+)'\}：(\d+)\.png/);
      if (match) {
        // 将数字转换为3位格式（如1 -> 001）
        const paddedNumber = match[5].padStart(3, '0');
        pokemonList.push({
          id: parseInt(match[5]), // 使用文件名中的数字作为ID
          english: match[1],
          japanese: match[2],
          chinese: match[3],
          french: match[4],
          imageUrl: `/thumbnails/${paddedNumber}.png`
        });
      }
    }
    
    return pokemonList;
  } catch (error) {
    console.error('解析宝可梦索引失败:', error);
    return [];
  }
}

// 解析特性数据
export async function parseAbilities(): Promise<AbilityData[]> {
  try {
    const abilityFileNames = await getAbilityFileNames();
    const abilities: AbilityData[] = [];
    
    // 并发请求所有特性文件
    const promises = abilityFileNames.map(async (fileName) => {
      try {
        const response = await fetch(`/特性/ability/${fileName}.json`);
        if (response.ok) {
          const data = await response.json();
          return {
            index: data.index,
            name: data.name,
            name_jp: data.name_jp,
            name_en: data.name_en,
            text: data.text,
            generation: data.generation
          };
        }
      } catch (error) {
        console.warn(`无法加载特性文件 ${fileName}:`, error);
      }
      return null;
    });
    
    const results = await Promise.all(promises);
    abilities.push(...results.filter(Boolean) as AbilityData[]);
    
    return abilities.sort((a, b) => a.index.localeCompare(b.index));
  } catch (error) {
    console.error('解析特性数据失败:', error);
    return [];
  }
}

// 获取所有特性文件名
export async function getAbilityFileNames(): Promise<string[]> {
  // 根据实际文件目录中的文件名列表
  const abilityNames = [
    '001-恶臭', '002-降雨', '003-加速', '004-战斗盔甲', '005-结实',
    '006-湿气', '007-柔软', '008-沙隐', '009-静电', '010-蓄电',
    '011-储水', '012-迟钝', '013-无关天气', '014-复眼', '015-不眠',
    '016-变色', '017-免疫', '018-引火', '019-鳞粉', '020-我行我素',
    '021-吸盘', '022-威吓', '023-踩影', '024-粗糙皮肤', '025-神奇守护',
    '026-飘浮', '027-孢子', '028-同步', '029-恒净之躯', '030-自然回复',
    '031-避雷针', '032-天恩', '033-悠游自如', '034-叶绿素', '035-发光',
    '036-复制', '037-大力士', '038-毒刺', '039-精神力', '040-熔岩铠甲',
    '041-水幕', '042-磁力', '043-隔音', '044-雨盘', '045-扬沙',
    '046-压迫感', '047-厚脂肪', '048-早起', '049-火焰之躯', '050-逃跑',
    '051-锐利目光', '052-怪力钳', '053-捡拾', '054-懒惰', '055-活力',
    '056-迷人之躯', '057-正电', '058-负电', '059-阴晴不定', '060-黏着',
    '061-蜕皮', '062-毅力', '063-神奇鳞片', '064-污泥浆', '065-茂盛',
    '066-猛火', '067-激流', '068-虫之预感', '069-坚硬脑袋', '070-日照',
    '071-沙穴', '072-干劲', '073-白色烟雾', '074-瑜伽之力', '075-硬壳盔甲',
    '076-杂音', '076-气闸', '077-蹒跚', '078-电气引擎', '079-斗争心',
    '080-不屈之心', '081-雪隐', '082-贪吃鬼', '083-愤怒穴位', '084-轻装',
    '085-耐热', '086-单纯', '087-干燥皮肤', '088-下载', '089-铁拳',
    '090-毒疗', '091-适应力', '092-连续攻击', '093-湿润之躯', '094-太阳之力',
    '095-飞毛腿', '096-一般皮肤', '097-狙击手', '098-魔法防守', '099-无防守',
    '100-慢出', '101-技术高手', '102-叶子防守', '103-笨拙', '104-破格',
    '105-超幸运', '106-引爆', '107-危险预知', '108-预知梦', '109-纯朴',
    '110-有色眼镜', '111-过滤', '112-慢启动', '113-胆量', '114-引水',
    '115-冰冻之躯', '116-坚硬岩石', '117-降雪', '118-采蜜', '119-察觉',
    '120-舍身', '121-多属性', '122-花之礼', '123-梦魇', '124-顺手牵羊',
    '125-强行', '126-唱反调', '127-紧张感', '128-不服输', '129-软弱',
    '130-咒术之躯', '131-治愈之心', '132-友情防守', '133-碎裂铠甲', '134-重金属',
    '135-轻金属', '136-多重鳞片', '137-中毒激升', '138-受热激升', '139-收获',
    '140-心灵感应', '141-心情不定', '142-防尘', '143-毒手', '144-再生力',
    '145-健壮胸肌', '146-拨沙', '147-奇迹皮肤', '148-分析', '149-幻觉',
    '150-变身者', '151-穿透', '152-木乃伊', '153-自信过度', '154-正义之心',
    '155-胆怯', '156-魔法镜', '157-食草', '158-恶作剧之心', '159-沙之力',
    '160-铁刺', '161-达摩模式', '162-胜利之星', '163-涡轮火焰', '164-兆级电压',
    '165-芳香幕', '166-花幕', '167-颊囊', '168-变幻自如', '169-毛皮大衣',
    '170-魔术师', '171-防弹', '172-好胜', '173-强壮之颚', '174-冰冻皮肤',
    '175-甜幕', '176-战斗切换', '177-疾风之翼', '178-超级发射器', '179-草之毛皮',
    '180-共生', '181-硬爪', '182-妖精皮肤', '183-黏滑', '184-飞行皮肤',
    '185-亲子爱', '186-暗黑气场', '187-妖精气场', '188-气场破坏', '189-始源之海',
    '190-终结之地', '191-德尔塔气流', '192-持久力', '193-跃跃欲逃', '194-危险回避',
    '195-遇水凝固', '196-不仁不义', '197-界限盾壳', '198-蹲守', '199-水泡',
    '200-钢能力者', '201-怒火冲天', '202-拨雪', '203-远隔', '204-湿润之声',
    '205-先行治疗', '206-电气皮肤', '207-冲浪之尾', '208-鱼群', '209-画皮',
    '210-牵绊变身', '211-群聚变形', '212-腐蚀', '213-绝对睡眠', '214-女王的威严',
    '215-飞出的内在物', '216-舞者', '217-蓄电池', '218-毛茸茸', '219-鲜艳之躯',
    '220-魂心', '221-卷发', '222-接球手', '223-化学之力', '224-异兽提升',
    '225-ＡＲ系统', '226-电气制造者', '227-精神制造者', '228-薄雾制造者', '229-青草制造者',
    '230-金属防护', '231-幻影防守', '232-棱镜装甲', '233-脑核之力', '234-不挠之剑',
    '235-不屈之盾', '236-自由者', '237-捡球', '238-棉絮', '239-螺旋尾鳍',
    '240-镜甲', '241-一口导弹', '242-坚毅', '243-蒸汽机', '244-庞克摇滚',
    '245-吐沙', '246-冰鳞粉', '247-熟成', '248-结冻头', '249-能量点',
    '250-拟态', '251-除障', '252-钢之意志', '253-灭亡之躯', '254-游魂',
    '255-一猩一意', '256-化学变化气体', '257-粉彩护幕', '258-饱了又饿', '259-速击',
    '260-无形拳', '261-怪药', '262-电晶体', '263-龙颚', '264-苍白嘶鸣',
    '265-漆黑嘶鸣', '266-人马一体', '267-人马一体', '268-甩不掉的气味', '269-掉出种子',
    '270-热交换', '271-愤怒甲壳', '272-洁净之盐', '273-焦香之躯', '274-乘风',
    '275-看门犬', '276-搬岩', '277-风力发电', '278-全能变身', '279-发号施令',
    '280-电力转换', '281-古代活性', '282-夸克充能', '283-黄金之躯', '284-灾祸之鼎',
    '285-灾祸之剑', '286-灾祸之简', '287-灾祸之玉', '288-绯红脉动', '289-强子引擎',
    '290-跟风', '291-反刍', '292-锋锐', '293-大将', '294-同台共演',
    '295-毒满地', '296-尾甲', '297-食土', '298-菌丝之力', '299-款待',
    '300-心眼', '301-面影辉映', '302-面影辉映', '303-面影辉映', '304-面影辉映',
    '305-毒锁链', '306-甘露之蜜', '308-太晶变形', '309-太晶甲壳', '310-归零化境',
    '311-毒傀儡'
  ];
  
  return abilityNames;
}

// 解析技能数据
export async function parseMoves(): Promise<MoveData[]> {
  try {
    const response = await fetch('/moves.yaml');
    const text = await response.text();
    
    // 简单的YAML解析（针对moves.yaml的特定格式）
    const moves: MoveData[] = [];
    const lines = text.split('\n');
    
    let currentMove: Partial<MoveData> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('- accuracy:')) {
        // 新的技能开始
        if (currentMove.id) {
          moves.push(currentMove as MoveData);
        }
        currentMove = {
          accuracy: parseInt(trimmedLine.split(':')[1].trim())
        };
      } else if (trimmedLine.startsWith('category:')) {
        currentMove.category = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('cname:')) {
        currentMove.cname = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('ename:')) {
        currentMove.ename = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('id:')) {
        currentMove.id = parseInt(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.startsWith('jname:')) {
        currentMove.jname = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('power:')) {
        const powerValue = trimmedLine.split(':')[1].trim();
        currentMove.power = powerValue === 'null' ? 0 : parseInt(powerValue) || 0;
      } else if (trimmedLine.startsWith('pp:')) {
        const ppValue = trimmedLine.split(':')[1].trim();
        currentMove.pp = ppValue === 'null' ? 0 : parseInt(ppValue) || 0;
      } else if (trimmedLine.startsWith('accuracy:')) {
        const accuracyValue = trimmedLine.split(':')[1].trim();
        currentMove.accuracy = accuracyValue === 'null' ? 0 : parseInt(accuracyValue) || 0;
      } else if (trimmedLine.startsWith('type:')) {
        currentMove.type = trimmedLine.split(':')[1].trim();
      }
    }
    
    // 添加最后一个技能
    if (currentMove.id) {
      moves.push(currentMove as MoveData);
    }
    
    return moves.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error('解析技能数据失败:', error);
    return [];
  }
}

// 搜索宝可梦
export function searchPokemon(pokemonList: PokemonIndexEntry[], query: string): PokemonIndexEntry[] {
  if (!query.trim()) return pokemonList;
  
  const lowerQuery = query.toLowerCase();
  return pokemonList.filter(pokemon => 
    pokemon.chinese.toLowerCase().includes(lowerQuery) ||
    pokemon.english.toLowerCase().includes(lowerQuery) ||
    pokemon.japanese.toLowerCase().includes(lowerQuery)
  );
}

// 搜索特性
export function searchAbilities(abilities: AbilityData[], query: string): AbilityData[] {
  if (!query.trim()) return abilities;
  
  const lowerQuery = query.toLowerCase();
  return abilities.filter(ability => 
    ability.name.toLowerCase().includes(lowerQuery) ||
    ability.name_en.toLowerCase().includes(lowerQuery) ||
    ability.name_jp.toLowerCase().includes(lowerQuery)
  );
}

// 搜索技能
export function searchMoves(moves: MoveData[], query: string): MoveData[] {
  if (!query.trim()) return moves;
  
  const lowerQuery = query.toLowerCase();
  return moves.filter(move => 
    move.cname.toLowerCase().includes(lowerQuery) ||
    move.ename.toLowerCase().includes(lowerQuery) ||
    move.jname.toLowerCase().includes(lowerQuery)
  );
}

// 解析包含种族值的宝可梦数据
export async function parsePokemonWithStats(): Promise<PokemonWithStats[]> {
  try {
    const response = await fetch('/pokedex.yaml');
    const text = await response.text();
    
    // 简单的YAML解析
    const lines = text.split('\n');
    const pokemonList: PokemonWithStats[] = [];
    let currentPokemon: Partial<PokemonWithStats> = {};
    let inBase = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('- id:')) {
        // 保存上一个宝可梦
        if (currentPokemon.id) {
          pokemonList.push(currentPokemon as PokemonWithStats);
        }
        // 开始新的宝可梦
        currentPokemon = {};
        inBase = false;
        const id = parseInt(trimmedLine.replace('- id:', '').trim());
        currentPokemon.id = id;
        const paddedNumber = id.toString().padStart(3, '0');
        currentPokemon.imageUrl = `/thumbnails/${paddedNumber}.png`;
      } else if (trimmedLine.startsWith('english:')) {
        currentPokemon.english = trimmedLine.replace('english:', '').trim();
      } else if (trimmedLine.startsWith('japanese:')) {
        currentPokemon.japanese = trimmedLine.replace('japanese:', '').trim();
      } else if (trimmedLine.startsWith('chinese:')) {
        currentPokemon.chinese = trimmedLine.replace('chinese:', '').trim();
      } else if (trimmedLine.startsWith('french:')) {
        currentPokemon.french = trimmedLine.replace('french:', '').trim();
      } else if (trimmedLine === 'base:') {
        inBase = true;
        currentPokemon.base = {
          HP: 0,
          Attack: 0,
          Defense: 0,
          'Sp. Attack': 0,
          'Sp. Defense': 0,
          Speed: 0
        };
      } else if (inBase && currentPokemon.base) {
        if (trimmedLine.startsWith('HP:')) {
          currentPokemon.base.HP = parseInt(trimmedLine.replace('HP:', '').trim());
        } else if (trimmedLine.startsWith('Attack:')) {
          currentPokemon.base.Attack = parseInt(trimmedLine.replace('Attack:', '').trim());
        } else if (trimmedLine.startsWith('Defense:')) {
          currentPokemon.base.Defense = parseInt(trimmedLine.replace('Defense:', '').trim());
        } else if (trimmedLine.startsWith('Sp. Attack:')) {
          currentPokemon.base['Sp. Attack'] = parseInt(trimmedLine.replace('Sp. Attack:', '').trim());
        } else if (trimmedLine.startsWith('Sp. Defense:')) {
          currentPokemon.base['Sp. Defense'] = parseInt(trimmedLine.replace('Sp. Defense:', '').trim());
        } else if (trimmedLine.startsWith('Speed:')) {
          currentPokemon.base.Speed = parseInt(trimmedLine.replace('Speed:', '').trim());
          inBase = false; // Speed是最后一个属性
        }
      }
    }
    
    // 保存最后一个宝可梦
    if (currentPokemon.id) {
      pokemonList.push(currentPokemon as PokemonWithStats);
    }
    
    return pokemonList;
  } catch (error) {
    console.error('Failed to parse pokedex.yaml:', error);
    return [];
  }
}

// 搜索包含种族值的宝可梦
export function searchPokemonWithStats(pokemonList: PokemonWithStats[], query: string): PokemonWithStats[] {
  if (!query.trim()) return pokemonList;
  
  const lowerQuery = query.toLowerCase();
  return pokemonList.filter(pokemon => 
    pokemon.chinese.toLowerCase().includes(lowerQuery) ||
    pokemon.english.toLowerCase().includes(lowerQuery) ||
    pokemon.japanese.toLowerCase().includes(lowerQuery) ||
    pokemon.french.toLowerCase().includes(lowerQuery)
  );
}

// 根据宝可梦名称自动匹配特性
export async function getAbilitiesForPokemon(pokemonName: string): Promise<string[]> {
  if (!pokemonName.trim()) return [];
  
  const abilities: string[] = [];
  const abilityFileNames = await getAbilityFileNames();
  
  for (const fileName of abilityFileNames) {
    try {
      const response = await fetch(`/特性/ability/${fileName}.json`);
      if (response.ok) {
        const abilityData = await response.json();
        
        // 检查该特性的pokemon字段中是否包含指定的宝可梦名称
        if (abilityData.pokemon && Array.isArray(abilityData.pokemon)) {
          const hasPokemon = abilityData.pokemon.some((pokemon: { name?: string }) => 
            pokemon.name && pokemon.name.includes(pokemonName)
          );
          
          if (hasPokemon && !abilities.includes(abilityData.name)) {
            abilities.push(abilityData.name);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading ability file ${fileName}:`, error);
    }
  }
  
  return abilities;
}