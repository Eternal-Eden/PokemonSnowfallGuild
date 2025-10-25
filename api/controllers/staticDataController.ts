import { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const prisma = new PrismaClient();

// 获取静态数据类型列表
export const getStaticDataTypes = async (req: any, res: any) => {
  try {
    const dataTypes = await prisma.staticDataCache.findMany({
      select: {
        dataType: true,
        lastUpdated: true
      },
      orderBy: { dataType: 'asc' }
    });

    res.json({
      success: true,
      data: dataTypes
    });
  } catch (error) {
    console.error('获取静态数据类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取静态数据类型失败'
    });
  }
};

// 获取指定类型的静态数据
export const getStaticData = async (req: any, res: any) => {
  try {
    const { type } = req.params;

    const staticData = await prisma.staticDataCache.findUnique({
      where: { dataType: type }
    });

    if (!staticData) {
      return res.status(404).json({
        success: false,
        message: '静态数据不存在'
      });
    }

    res.json({
      success: true,
      data: {
        type: staticData.dataType,
        content: staticData.dataContent,
        lastUpdated: staticData.lastUpdated
      }
    });
  } catch (error) {
    console.error('获取静态数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取静态数据失败'
    });
  }
};

// 获取所有类型
export const getTypes = async (req: any, res: any) => {
  try {
    const typesData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'types' }
    });

    if (!typesData) {
      return res.status(404).json({
        success: false,
        message: '类型数据不存在'
      });
    }

    res.json({
      success: true,
      data: typesData.dataContent
    });
  } catch (error) {
    console.error('获取类型数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取类型数据失败'
    });
  }
};

// 获取所有性格
export const getNatures = async (req: any, res: any) => {
  try {
    const naturesData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'natures' }
    });

    if (!naturesData) {
      return res.status(404).json({
        success: false,
        message: '性格数据不存在'
      });
    }

    res.json({
      success: true,
      data: naturesData.dataContent
    });
  } catch (error) {
    console.error('获取性格数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取性格数据失败'
    });
  }
};

// 获取招式列表
export const getMoves = async (req: any, res: any) => {
  try {
    const { search, type, category, page = 1, limit = 50 } = req.query;

    const movesData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'moves' }
    });

    if (!movesData) {
      return res.status(404).json({
        success: false,
        message: '技能数据不存在'
      });
    }

    let moves = movesData.dataContent as any[];

    // 应用过滤条件
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      moves = moves.filter(move => 
        move.cname?.toLowerCase().includes(searchTerm) ||
        move.ename?.toLowerCase().includes(searchTerm) ||
        move.jname?.toLowerCase().includes(searchTerm)
      );
    }

    if (type) {
      moves = moves.filter(move => move.type === type);
    }

    if (category) {
      moves = moves.filter(move => move.category === category);
    }

    // 分页
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const total = moves.length;
    const paginatedMoves = moves.slice(skip, skip + take);

    res.json({
      success: true,
      data: {
        moves: paginatedMoves,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取技能数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取技能数据失败'
    });
  }
};

// 搜索技能（用于模板创建时的选择器）
// 搜索招式
export const searchMoves = async (req: any, res: any) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const movesData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'moves' }
    });

    if (!movesData) {
      return res.status(404).json({
        success: false,
        message: '技能数据不存在'
      });
    }

    const moves = movesData.dataContent as any[];
    const searchTerm = (q as string).toLowerCase();
    
    const filteredMoves = moves
      .filter(move => 
        move.cname?.toLowerCase().includes(searchTerm) ||
        move.ename?.toLowerCase().includes(searchTerm) ||
        move.jname?.toLowerCase().includes(searchTerm)
      )
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: filteredMoves
    });
  } catch (error) {
    console.error('搜索技能失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索技能失败'
    });
  }
};

// 获取道具列表
export const getItems = async (req: any, res: any) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const itemsData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'items' }
    });

    if (!itemsData) {
      return res.status(404).json({
        success: false,
        message: '道具数据不存在'
      });
    }

    let items = itemsData.dataContent as any[];

    // 应用搜索过滤
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      items = items.filter(item => 
        item.name?.english?.toLowerCase().includes(searchTerm) ||
        item.name?.chinese?.toLowerCase().includes(searchTerm) ||
        item.name?.japanese?.toLowerCase().includes(searchTerm)
      );
    }

    // 分页
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const total = items.length;
    const paginatedItems = items.slice(skip, skip + take);

    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取道具数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取道具数据失败'
    });
  }
};

// 搜索道具（用于模板创建时的选择器）
// 搜索道具
export const searchItems = async (req: any, res: any) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const itemsData = await prisma.staticDataCache.findUnique({
      where: { dataType: 'items' }
    });

    if (!itemsData) {
      return res.status(404).json({
        success: false,
        message: '道具数据不存在'
      });
    }

    const items = itemsData.dataContent as any[];
    const searchTerm = (q as string).toLowerCase();
    
    const filteredItems = items
      .filter(item => 
        item.name?.english?.toLowerCase().includes(searchTerm) ||
        item.name?.chinese?.toLowerCase().includes(searchTerm) ||
        item.name?.japanese?.toLowerCase().includes(searchTerm)
      )
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: filteredItems
    });
  } catch (error) {
    console.error('搜索道具失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索道具失败'
    });
  }
};

// 获取数据统计
export const getDataStats = async (req: any, res: any) => {
  try {
    const [
      pokemonCount,
      templateCount,
      userCount,
      favoriteCount,
      staticDataTypes
    ] = await Promise.all([
      prisma.pokemon.count(),
      prisma.template.count(),
      prisma.user.count(),
      prisma.favorite.count(),
      prisma.staticDataCache.findMany({
        select: {
          dataType: true,
          dataContent: true,
          lastUpdated: true
        }
      })
    ]);

    // 获取各类静态数据的数量
    const staticDataStats = await Promise.all(
      staticDataTypes.map(async (data: any) => {
        const content = data.dataContent as any[];
        return {
          type: data.dataType,
          count: Array.isArray(content) ? content.length : 0,
          lastUpdated: data.lastUpdated
        };
      })
    );

    res.json({
      success: true,
      data: {
        pokemonCount,
        templateCount,
        userCount,
        favoriteCount,
        staticData: staticDataStats
      }
    });
  } catch (error) {
    console.error('获取数据统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据统计失败'
    });
  }
};

// 获取自定义道具列表
export const getCustomItems = async (req: any, res: any) => {
  try {
    const itemsCustomPath = path.join(process.cwd(), 'public', 'items_custom.yaml');
    
    if (!fs.existsSync(itemsCustomPath)) {
      return res.status(404).json({
        success: false,
        message: '自定义道具文件不存在'
      });
    }

    const fileContent = fs.readFileSync(itemsCustomPath, 'utf8');
    const itemsData = yaml.load(fileContent) as any;

    if (!itemsData) {
      return res.status(500).json({
        success: false,
        message: '解析自定义道具文件失败'
      });
    }

    // 提取所有道具名称
    const items: Array<{id: string, name: string, category: string}> = [];
    
    // 处理攻击道具
    if (itemsData.attacker_items) {
      Object.keys(itemsData.attacker_items).forEach((itemName, index) => {
        items.push({
          id: `attacker_${index}`,
          name: itemName,
          category: 'attacker'
        });
      });
    }

    // 处理防御道具
    if (itemsData.defender_items) {
      Object.keys(itemsData.defender_items).forEach((itemName, index) => {
        items.push({
          id: `defender_${index}`,
          name: itemName,
          category: 'defender'
        });
      });
    }

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('获取自定义道具失败:', error);
    res.status(500).json({
      success: false,
      message: '获取自定义道具失败'
    });
  }
};