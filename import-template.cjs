const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const yaml = require('yaml');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function importTemplate() {
  try {
    console.log('开始导入模板...');

    // 读取YAML文件
    const yamlPath = 'd:\\code\\LuoXue\\src\\app\\templates\\皮卡丘伤害计算模板_1761300796198.yaml';
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const templateData = yaml.parse(yamlContent);

    console.log('YAML文件读取成功:', templateData.metadata?.name);

    // 检查或创建默认用户
    let user = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!user) {
      console.log('创建默认用户...');
      user = await prisma.user.create({
        data: {
          username: 'admin',
          gameNickname: '管理员',
          email: 'admin@example.com',
          passwordHash: '$2b$12$dummy.hash.for.admin.user',
          role: 'ADMIN',
          isActive: true,
          uniqueId: 'ADMIN001'
        }
      });
      console.log('默认用户创建成功:', user.id);
    } else {
      console.log('使用现有用户:', user.id);
    }

    // 检查或创建Pokemon记录
    let pokemon = await prisma.pokemon.findUnique({
      where: { id: 25 }
    });

    if (!pokemon) {
      console.log('创建皮卡丘Pokemon记录...');
      pokemon = await prisma.pokemon.create({
        data: {
          id: 25,
          nameChinese: '皮卡丘',
          nameEnglish: 'Pikachu',
          nameJapanese: 'ピカチュウ',
          types: ['Electric'],
          baseStats: {
            hp: 35,
            attack: 55,
            defense: 40,
            specialAttack: 50,
            specialDefense: 50,
            speed: 90
          }
        }
      });
      console.log('皮卡丘Pokemon记录创建成功');
    } else {
      console.log('皮卡丘Pokemon记录已存在');
    }

    // 生成数据哈希
    const dataForHash = {
      pokemonId: templateData.pokemon.id,
      level: templateData.config.level,
      nature: templateData.config.nature,
      ability: templateData.config.ability,
      item: templateData.config.item,
      moves: templateData.config.moves,
      evs: templateData.evs,
      ivs: templateData.ivs
    };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(dataForHash)).digest('hex');

    // 检查是否已存在相同的模板
    const existingTemplate = await prisma.template.findFirst({
      where: { dataHash }
    });

    if (existingTemplate) {
      console.log('相同的模板已存在:', existingTemplate.name);
      return;
    }

    // 创建模板
    console.log('创建模板记录...');
    const template = await prisma.template.create({
      data: {
        userId: user.id,
        pokemonId: templateData.pokemon.id,
        name: templateData.metadata.name,
        level: templateData.config.level,
        nature: templateData.config.nature,
        ability: templateData.config.ability,
        item: templateData.config.item,
        ivs: templateData.ivs,
        evs: templateData.evs,
        dataHash: dataHash,
        isPublic: templateData.metadata.isPublic || false
      }
    });

    console.log('模板创建成功:', template.id);

    // 创建技能记录
    console.log('创建技能记录...');
    for (let i = 0; i < templateData.config.moves.length; i++) {
      const move = templateData.config.moves[i];
      await prisma.templateMove.create({
        data: {
          templateId: template.id,
          moveId: move.id || null,
          moveName: move.name,
          moveCategory: move.category || 'Physical',
          position: i + 1
        }
      });
    }

    console.log('技能记录创建完成');
    console.log('模板导入成功！模板ID:', template.id);

  } catch (error) {
    console.error('导入模板时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行导入
importTemplate()