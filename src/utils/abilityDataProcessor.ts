import * as yaml from 'js-yaml';

// 特性数据接口
export interface AbilityData {
  index: string;
  generation: string;
  name: string;
  name_jp: string;
  name_en: string;
  text: string;
  common_count: number;
  hidden_count: number;
  effect: string;
  info: string[];
  pokemon: PokemonAbilityRelation[];
}

// 宝可梦特性关系接口
export interface PokemonAbilityRelation {
  index: string;
  name: string;
  types: string[];
  first: string;
  second: string;
  hidden: string;
}

// 特殊特性配置接口
export interface SpecialAbilityConfig {
  效果: string;
  触发条件: string;
  备注: string;
}

// 扩展的特性数据接口（包含特殊特性信息）
export interface ExtendedAbilityData extends AbilityData {
  isSpecial?: boolean;
  specialType?: 'offensive' | 'defensive';
  specialConfig?: SpecialAbilityConfig;
}

// 模板中的特性配置接口
export interface TemplateAbilityConfig {
  name: string;
  index: string;
  common_count: number;
  hidden_count: number;
  isSpecial?: boolean;
  specialType?: 'offensive' | 'defensive';
  effect?: string;
  trigger_condition?: string;
  note?: string;
}

// 缓存特殊特性配置
let defensiveAbilitiesCache: Record<string, SpecialAbilityConfig> | null = null;
let offensiveAbilitiesCache: Record<string, SpecialAbilityConfig> | null = null;

/**
 * 获取特性文件名列表
 */
async function getAbilityFileNames(): Promise<string[]> {
  // 完整的特性文件名列表
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

  try {
    // 尝试动态获取目录列表
    const response = await fetch('/特性/ability/');
    if (response.ok) {
      const html = await response.text();
      const fileNames: string[] = [];
      
      // 简单的HTML解析来提取文件名
      const regex = /href="([^"]+\.json)"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const fileName = match[1].replace('.json', '');
        fileNames.push(fileName);
      }
      
      // 如果成功获取到文件列表，返回动态获取的列表
      if (fileNames.length > 0) {
        return fileNames;
      }
    }
  } catch (error) {
    console.error('动态获取特性文件列表失败，使用静态列表:', error);
  }

  // 如果无法动态获取目录列表，返回完整的静态特性文件名列表
  return abilityNames;
}

/**
 * 加载防守特性配置
 */
async function loadDefensiveAbilities(): Promise<Record<string, SpecialAbilityConfig>> {
  if (defensiveAbilitiesCache) {
    return defensiveAbilitiesCache;
  }

  try {
    const response = await fetch('/防守特性.yaml');
    if (!response.ok) {
      throw new Error('无法加载防守特性配置');
    }
    
    const yamlText = await response.text();
    const data = yaml.load(yamlText) as { 防守特性: Record<string, SpecialAbilityConfig> };
    
    defensiveAbilitiesCache = data.防守特性 || {};
    return defensiveAbilitiesCache;
  } catch (error) {
    console.error('加载防守特性配置失败:', error);
    defensiveAbilitiesCache = {};
    return defensiveAbilitiesCache;
  }
}

/**
 * 加载进攻特性配置
 */
async function loadOffensiveAbilities(): Promise<Record<string, SpecialAbilityConfig>> {
  if (offensiveAbilitiesCache) {
    return offensiveAbilitiesCache;
  }

  try {
    const response = await fetch('/进攻特性.yaml');
    if (!response.ok) {
      throw new Error('无法加载进攻特性配置');
    }
    
    const yamlText = await response.text();
    const data = yaml.load(yamlText) as { 进攻特性: Record<string, SpecialAbilityConfig> };
    
    offensiveAbilitiesCache = data.进攻特性 || {};
    return offensiveAbilitiesCache;
  } catch (error) {
    console.error('加载进攻特性配置失败:', error);
    offensiveAbilitiesCache = {};
    return offensiveAbilitiesCache;
  }
}

/**
 * 检查特性是否为特殊特性
 */
export async function checkSpecialAbility(abilityName: string): Promise<{
  isSpecial: boolean;
  type?: 'offensive' | 'defensive';
  config?: SpecialAbilityConfig;
}> {
  try {
    // 检查防守特性
    const defensiveAbilities = await loadDefensiveAbilities();
    if (defensiveAbilities[abilityName]) {
      return {
        isSpecial: true,
        type: 'defensive',
        config: defensiveAbilities[abilityName]
      };
    }

    // 检查进攻特性
    const offensiveAbilities = await loadOffensiveAbilities();
    if (offensiveAbilities[abilityName]) {
      return {
        isSpecial: true,
        type: 'offensive',
        config: offensiveAbilities[abilityName]
      };
    }

    return { isSpecial: false };
  } catch (error) {
    console.error('检查特殊特性失败:', error);
    return { isSpecial: false };
  }
}

/**
 * 获取宝可梦的可用特性
 */
export async function getPokemonAbilities(pokemonName: string): Promise<ExtendedAbilityData[]> {
  if (!pokemonName.trim()) return [];
  
  const abilities: ExtendedAbilityData[] = [];
  const abilityFileNames = await getAbilityFileNames();
  
  for (const fileName of abilityFileNames) {
    try {
      const response = await fetch(`/特性/ability/${fileName}.json`);
      if (response.ok) {
        const abilityData: AbilityData = await response.json();
        
        // 检查该特性的pokemon字段中是否包含指定的宝可梦名称
        if (abilityData.pokemon && Array.isArray(abilityData.pokemon)) {
          const hasPokemon = abilityData.pokemon.some((pokemon: PokemonAbilityRelation) => 
            pokemon.name && pokemon.name.includes(pokemonName)
          );
          
          if (hasPokemon) {
            // 检查是否为特殊特性
            const specialInfo = await checkSpecialAbility(abilityData.name);
            
            const extendedAbility: ExtendedAbilityData = {
              ...abilityData,
              isSpecial: specialInfo.isSpecial,
              specialType: specialInfo.type,
              specialConfig: specialInfo.config
            };
            
            abilities.push(extendedAbility);
          }
        }
      }
    } catch (error) {
      console.error(`加载特性文件 ${fileName} 失败:`, error);
    }
  }
  
  // 按特性名称排序
  return abilities.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 根据特性名称获取完整特性数据
 */
export async function getAbilityByName(abilityName: string): Promise<ExtendedAbilityData | null> {
  if (!abilityName.trim()) return null;
  
  const abilityFileNames = await getAbilityFileNames();
  
  for (const fileName of abilityFileNames) {
    try {
      const response = await fetch(`/特性/ability/${fileName}.json`);
      if (response.ok) {
        const abilityData: AbilityData = await response.json();
        
        if (abilityData.name === abilityName) {
          // 检查是否为特殊特性
          const specialInfo = await checkSpecialAbility(abilityData.name);
          
          return {
            ...abilityData,
            isSpecial: specialInfo.isSpecial,
            specialType: specialInfo.type,
            specialConfig: specialInfo.config
          };
        }
      }
    } catch (error) {
      console.error(`加载特性文件 ${fileName} 失败:`, error);
    }
  }
  
  return null;
}

/**
 * 生成模板特性配置
 */
export function generateTemplateAbilityConfig(abilityData: ExtendedAbilityData): TemplateAbilityConfig {
  const config: TemplateAbilityConfig = {
    name: abilityData.name,
    index: abilityData.index,
    common_count: abilityData.common_count,
    hidden_count: abilityData.hidden_count
  };

  if (abilityData.isSpecial && abilityData.specialConfig) {
    config.isSpecial = true;
    config.specialType = abilityData.specialType;
    config.effect = abilityData.specialConfig.效果;
    config.trigger_condition = abilityData.specialConfig.触发条件;
    config.note = abilityData.specialConfig.备注;
  }

  return config;
}