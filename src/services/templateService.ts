/**
 * 模板服务
 * 处理模板相关的API调用和业务逻辑
 */

import { api } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';

// 模板相关类型定义
export interface TemplateData {
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  ability?: string;
  heldItem?: string;
  moves: Array<{
    id: number;
    name: string;
    type: string;
    category: string;
    power?: number;
    accuracy?: number;
    pp: number;
  }>;
  nature: string;
  level: number;
  gender?: 'male' | 'female' | 'genderless';
  shiny?: boolean;
  nickname?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string[];
  level: number;
  nature: string;
  item?: string;
  moves: TemplateMove[];
  templateData: TemplateData;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  favoriteCount: number;
  viewCount: number;
  usageCount: number;
  isFavorite?: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMove {
  id: string;
  moveId: number;
  moveName: string;
  moveCategory: string;
  position: number;
}

export interface CreateTemplateData {
  pokemonId: number;
  name: string;
  description?: string;
  level: number;
  nature: string;
  item?: string;
  moves: {
    moveId: number;
    moveName: string;
    moveCategory: string;
    position: number;
  }[];
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  name: string;
}

export interface TemplateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  pokemonId?: number;
  userId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'favoriteCount' | 'viewCount' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 模板服务类
 */
class TemplateService {
  private readonly baseUrl = '/templates';

  /**
   * 获取模板列表
   */
  async getTemplates(params: TemplateQueryParams = {}): Promise<PaginatedResponse<Template[]>> {
    const response = await api.get<PaginatedResponse<Template[]>>(this.baseUrl, { params });
    return response.data || { 
      success: true, 
      data: [], 
      pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
    };
  }

  /**
   * 获取单个模板详情
   */
  async getTemplate(id: string): Promise<Template> {
    const response = await api.get<ApiResponse<Template>>(`${this.baseUrl}/${id}`);
    if (!response.data?.data) {
      throw new Error('Template not found');
    }
    return response.data.data;
  }

  /**
   * 创建模板
   */
  async createTemplate(data: CreateTemplateData): Promise<Template> {
    const response = await api.post<ApiResponse<Template>>(this.baseUrl, data);
    if (!response.data?.data) {
      throw new Error('Failed to create template');
    }
    return response.data.data;
  }

  /**
   * 更新模板（需要权限验证）
   */
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<Template> {
    const response = await api.put<ApiResponse<Template>>(`${this.baseUrl}/${id}`, data);
    if (!response.data?.data) {
      throw new Error('Failed to update template');
    }
    return response.data.data;
  }

  /**
   * 删除模板（需要权限验证）
   */
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 收藏/取消收藏模板
   */
  async toggleFavorite(id: string): Promise<{ isFavorited: boolean }> {
    const response = await api.post<ApiResponse<{ isFavorited: boolean }>>(`${this.baseUrl}/${id}/favorite`);
    if (!response.data?.data) {
      throw new Error('Failed to toggle favorite');
    }
    return response.data.data;
  }

  /**
   * 获取用户收藏的模板
   */
  async getFavoriteTemplates(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Template[]>> {
    const response = await api.get<PaginatedResponse<Template[]>>(`${this.baseUrl}/favorites`, { params });
    return response.data || { 
      success: true, 
      data: [], 
      pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
    };
  }

  /**
   * 获取用户创建的模板
   */
  async getUserTemplates(userId: string, params: TemplateQueryParams = {}): Promise<PaginatedResponse<Template[]>> {
    try {
      const response = await api.get<PaginatedResponse<Template[]>>(this.baseUrl, { 
        params: { ...params, userId } 
      });
      return response.data || { 
        success: true, 
        data: [], 
        pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
      };
    } catch (error) {
      console.error('获取用户模板失败:', error);
      return { 
        success: false, 
        data: [], 
        pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
      };
    }
  }

  /**
   * 检查模板权限
   */
  async checkTemplatePermission(templateId: string, userId: string): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateId);
      return template.author.id === userId;
    } catch (error) {
      console.error('检查模板权限失败:', error);
      return false;
    }
  }

  /**
   * 验证模板数据
   */
  validateTemplateData(data: CreateTemplateData | UpdateTemplateData): string[] {
    const errors: string[] = [];

    if ('pokemonId' in data && (!data.pokemonId || data.pokemonId <= 0)) {
      errors.push('请选择有效的宝可梦');
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push('模板名称不能为空');
    }

    if (data.name && data.name.length > 100) {
      errors.push('模板名称不能超过100个字符');
    }

    if ('level' in data && (!data.level || data.level < 1 || data.level > 100)) {
      errors.push('等级必须在1-100之间');
    }

    if ('nature' in data && (!data.nature || data.nature.trim().length === 0)) {
      errors.push('请选择性格');
    }

    if ('moves' in data && (!data.moves || data.moves.length === 0)) {
      errors.push('至少需要选择一个技能');
    }

    if ('moves' in data && data.moves && data.moves.length > 4) {
      errors.push('最多只能选择4个技能');
    }

    return errors;
  }

  /**
   * 生成智能模板名称
   */
  generateSmartTemplateName(pokemonName: string, baseName?: string): string {
    const base = baseName || `${pokemonName}伤害计算模板`;
    const timestamp = Date.now();
    return `${base}_${timestamp}`;
  }

  /**
   * 检查模板名称是否重复
   */
  async checkTemplateNameDuplicate(name: string, userId: string, excludeId?: string): Promise<boolean> {
    try {
      const templates = await this.getUserTemplates(userId, { limit: 1000 });
      // 确保templates和templates.data都存在且是数组
      if (!templates || !templates.data || !Array.isArray(templates.data)) {
        console.warn('获取用户模板数据异常，跳过重复检查');
        return false;
      }
      return templates.data.some((template: Template) => 
        template.name === name && template.id !== excludeId
      );
    } catch (error) {
      console.error('检查模板名称重复失败:', error);
      return false;
    }
  }

  /**
   * 获取推荐的模板名称
   */
  async getRecommendedTemplateName(pokemonName: string, userId: string, baseName?: string): Promise<string> {
    const base = baseName || `${pokemonName}伤害计算模板`;
    let counter = 1;
    let finalName = base;

    while (await this.checkTemplateNameDuplicate(finalName, userId)) {
      counter++;
      finalName = `${base}${counter}`;
    }

    return finalName;
  }
}

// 创建服务实例
export const templateService = new TemplateService();

// 导出常用方法
export const getTemplates = (params?: TemplateQueryParams) => templateService.getTemplates(params);
export const getTemplate = (id: string) => templateService.getTemplate(id);
export const createTemplate = (data: CreateTemplateData) => templateService.createTemplate(data);
export const updateTemplate = (id: string, data: UpdateTemplateData) => templateService.updateTemplate(id, data);
export const deleteTemplate = (id: string) => templateService.deleteTemplate(id);
export const toggleFavorite = (id: string) => templateService.toggleFavorite(id);
export const getFavoriteTemplates = (params?: { page?: number; limit?: number }) => templateService.getFavoriteTemplates(params);
export const getUserTemplates = (userId: string, params?: TemplateQueryParams) => templateService.getUserTemplates(userId, params);
export const checkTemplatePermission = (templateId: string, userId: string) => templateService.checkTemplatePermission(templateId, userId);
export const validateTemplateData = (data: CreateTemplateData | UpdateTemplateData) => templateService.validateTemplateData(data);
export const generateSmartTemplateName = (pokemonName: string, baseName?: string) => templateService.generateSmartTemplateName(pokemonName, baseName);
export const getRecommendedTemplateName = (pokemonName: string, userId: string, baseName?: string) => templateService.getRecommendedTemplateName(pokemonName, userId, baseName);

export default templateService;