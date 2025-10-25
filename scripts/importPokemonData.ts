import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const prisma = new PrismaClient();

interface PokedexEntry {
  id: number;
  name: {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
  };
  type: string[];
  base: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
}

interface Nature {
  name: string;
  HP: number;
  Attack: number;
  Defense: number;
  Sp_Attack: number;
  Sp_Defense: number;
  Speed: number;
}

interface Move {
  id: number;
  accuracy: number | null;
  category: string;
  cname: string;
  ename: string;
  jname: string;
  power: number | null;
  pp: number;
  type: string;
  tm?: number;
}

interface Item {
  id: number;
  name: {
    english?: string;
    japanese?: string;
    chinese?: string;
  };
}

interface Type {
  english: string;
  chinese: string;
  japanese: string;
}

async function importTypes() {
  console.log('导入属性数据...');
  
  const typesPath = path.join(process.cwd(), 'public', 'types.yaml');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const types = yaml.load(typesContent) as Type[];

  await prisma.staticDataCache.upsert({
    where: {
      dataType: 'types'
    },
    update: {
      dataContent: types as any,
      lastUpdated: new Date()
    },
    create: {
      dataType: 'types',
      dataContent: types as any
    }
  });
  
  console.log(`已导入 ${types.length} 个属性`);
}

async function importNatures() {
  console.log('导入性格数据...');
  
  const naturesPath = path.join(process.cwd(), 'public', 'pokemon_natures.yaml');
  const naturesContent = fs.readFileSync(naturesPath, 'utf-8');
  const naturesData = yaml.load(naturesContent) as { natures: Nature[] };

  await prisma.staticDataCache.upsert({
    where: {
      dataType: 'natures'
    },
    update: {
      dataContent: naturesData.natures as any,
      lastUpdated: new Date()
    },
    create: {
      dataType: 'natures',
      dataContent: naturesData.natures as any
    }
  });
  
  console.log(`已导入 ${naturesData.natures.length} 个性格`);
}

async function importMoves() {
  console.log('导入技能数据...');
  
  const movesPath = path.join(process.cwd(), 'public', 'moves.yaml');
  const movesContent = fs.readFileSync(movesPath, 'utf-8');
  const moves = yaml.load(movesContent) as Move[];

  await prisma.staticDataCache.upsert({
    where: {
      dataType: 'moves'
    },
    update: {
      dataContent: moves as any,
      lastUpdated: new Date()
    },
    create: {
      dataType: 'moves',
      dataContent: moves as any
    }
  });
  
  console.log(`已导入 ${moves.length} 个技能`);
}

async function importItems() {
  console.log('导入道具数据...');
  
  const itemsPath = path.join(process.cwd(), 'public', 'items.yaml');
  const itemsContent = fs.readFileSync(itemsPath, 'utf-8');
  const items = yaml.load(itemsContent) as Item[];

  await prisma.staticDataCache.upsert({
    where: {
      dataType: 'items'
    },
    update: {
      dataContent: items as any,
      lastUpdated: new Date()
    },
    create: {
      dataType: 'items',
      dataContent: items as any
    }
  });
  
  console.log(`已导入 ${items.length} 个道具`);
}

async function importPokedex() {
  console.log('导入宝可梦数据...');
  
  const pokedexPath = path.join(process.cwd(), 'public', 'pokedex.yaml');
  const pokedexContent = fs.readFileSync(pokedexPath, 'utf-8');
  const pokedex = yaml.load(pokedexContent) as PokedexEntry[];

  let count = 0;
  for (const pokemon of pokedex) {
    await prisma.pokemon.upsert({
      where: {
        id: pokemon.id
      },
      update: {
        nameChinese: pokemon.name.chinese,
        nameEnglish: pokemon.name.english,
        nameJapanese: pokemon.name.japanese,
        types: pokemon.type,
        baseStats: pokemon.base
      },
      create: {
        id: pokemon.id,
        nameChinese: pokemon.name.chinese,
        nameEnglish: pokemon.name.english,
        nameJapanese: pokemon.name.japanese,
        types: pokemon.type,
        baseStats: pokemon.base
      }
    });
    
    count++;
    if (count % 100 === 0) {
      console.log(`已导入 ${count} 个宝可梦...`);
    }
  }
  
  console.log(`已导入 ${pokedex.length} 个宝可梦`);
}

async function main() {
  try {
    console.log('开始导入宝可梦数据...');
    
    // 按顺序导入数据
    await importTypes();
    await importNatures();
    await importMoves();
    await importItems();
    await importPokedex();
    
    console.log('所有数据导入完成！');
  } catch (error) {
    console.error('导入数据时发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 直接运行脚本
main();

export { main as importPokemonData };