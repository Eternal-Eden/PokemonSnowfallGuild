/**
 * 雪花ID管理服务
 * 负责管理雪花算法的节点配置和ID生成
 */

import { PrismaClient } from '@prisma/client';
import { SnowflakeGenerator } from './snowflake';
import { logger } from './logger';

export interface NodeConfig {
  nodeId: number;
  datacenterId: number;
  machineId: number;
  isActive: boolean;
}

export class SnowflakeService {
  private static instance: SnowflakeService;
  private generator: SnowflakeGenerator | null = null;
  private prisma: PrismaClient;
  private initialized = false;
  private nodeConfig: NodeConfig | null = null;
  
  private constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): SnowflakeService {
    if (!SnowflakeService.instance) {
      SnowflakeService.instance = new SnowflakeService();
    }
    return SnowflakeService.instance;
  }
  
  /**
   * 初始化雪花服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Snowflake service already initialized');
      return;
    }
    
    try {
      logger.info('Initializing snowflake service...');
      
      // 获取或创建节点配置
      this.nodeConfig = await this.getOrCreateNodeConfig();
      this.generator = new SnowflakeGenerator(this.nodeConfig.machineId, this.nodeConfig.datacenterId);
      this.initialized = true;
      
      logger.info(`Snowflake service initialized successfully`, {
        nodeId: this.nodeConfig.nodeId,
        datacenterId: this.nodeConfig.datacenterId,
        machineId: this.nodeConfig.machineId
      });
    } catch (error) {
      logger.error('Failed to initialize snowflake service', error);
      throw new Error(`Snowflake service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取或创建节点配置
   */
  private async getOrCreateNodeConfig(): Promise<NodeConfig> {
    try {
      // 尝试获取现有的活跃配置
      let config = await this.prisma.snowflakeConfig.findFirst({
        where: { isActive: true }
      });
      
      if (!config) {
        logger.info('No active snowflake config found, creating new one...');
        
        // 生成新的节点ID
        const nodeId = await this.generateAvailableNodeId();
        const datacenterId = Math.floor(nodeId / 32);
        const machineId = nodeId % 32;
        
        config = await this.prisma.snowflakeConfig.create({
          data: {
            nodeId,
            datacenterId,
            machineId,
            isActive: true,
            lastTimestamp: BigInt(0),
            sequence: 0
          }
        });
        
        logger.info(`Created new snowflake config`, {
          nodeId,
          datacenterId,
          machineId
        });
      } else {
        logger.info(`Using existing snowflake config`, {
          nodeId: config.nodeId,
          datacenterId: config.datacenterId,
          machineId: config.machineId
        });
      }
      
      return {
        nodeId: config.nodeId,
        datacenterId: config.datacenterId,
        machineId: config.machineId,
        isActive: config.isActive
      };
    } catch (error) {
      logger.error('Failed to get or create node config', error);
      throw error;
    }
  }
  
  /**
   * 生成可用的节点ID
   */
  private async generateAvailableNodeId(): Promise<number> {
    try {
      // 查找已使用的节点ID
      const usedConfigs = await this.prisma.snowflakeConfig.findMany({
        select: { nodeId: true },
        orderBy: { nodeId: 'asc' }
      });
      
      const usedNodeIds = new Set(usedConfigs.map(config => config.nodeId));
      
      // 查找第一个可用的节点ID（0-1023）
      for (let i = 0; i < 1024; i++) {
        if (!usedNodeIds.has(i)) {
          logger.debug(`Found available node ID: ${i}`);
          return i;
        }
      }
      
      throw new Error('No available node ID found (all 1024 slots are used)');
    } catch (error) {
      logger.error('Failed to generate available node ID', error);
      throw error;
    }
  }
  
  /**
   * 生成通用ID
   */
  public async generateId(): Promise<string> {
    if (!this.initialized) {
      logger.debug('Service not initialized, initializing now...');
      await this.initialize();
    }
    
    if (!this.generator) {
      throw new Error('Snowflake generator not initialized');
    }
    
    try {
      const id = await this.generator.generateId();
      const idStr = id.toString();
      
      logger.debug(`Generated ID: ${idStr}`);
      
      // 更新最后使用的时间戳（可选，用于监控）
      await this.updateLastTimestamp();
      
      return idStr;
    } catch (error) {
      logger.error('Failed to generate ID', error);
      throw new Error(`Failed to generate ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成追溯ID
   */
  public async generateTraceId(): Promise<string> {
    if (!this.initialized) {
      logger.debug('Service not initialized, initializing now...');
      await this.initialize();
    }
    
    if (!this.generator) {
      throw new Error('Snowflake generator not initialized');
    }
    
    try {
      const id = await this.generator.generateId();
      const idStr = id.toString();
      
      logger.debug(`Generated trace ID: ${idStr}`);
      
      // 更新最后使用的时间戳（可选，用于监控）
      await this.updateLastTimestamp();
      
      return idStr;
    } catch (error) {
      logger.error('Failed to generate trace ID', error);
      throw new Error(`Failed to generate trace ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 解析追溯ID
   */
  public parseTraceId(traceId: string | bigint): {
    timestamp: number;
    datacenterId: number;
    machineId: number;
    sequence: number;
    generateTime: Date;
  } {
    try {
      const id = typeof traceId === 'string' ? BigInt(traceId) : traceId;
      return SnowflakeGenerator.parseId(id);
    } catch (error) {
      logger.error('Failed to parse trace ID', { traceId, error });
      throw new Error(`Invalid trace ID: ${traceId}`);
    }
  }
  
  /**
   * 验证追溯ID的有效性
   */
  public isValidTraceId(traceId: string): boolean {
    try {
      const id = BigInt(traceId);
      return SnowflakeGenerator.isValidId(id);
    } catch {
      return false;
    }
  }
  
  /**
   * 更新最后使用的时间戳
   */
  private async updateLastTimestamp(): Promise<void> {
    if (!this.nodeConfig) return;
    
    try {
      const now = BigInt(Date.now());
      await this.prisma.snowflakeConfig.updateMany({
        where: { 
          nodeId: this.nodeConfig.nodeId,
          isActive: true 
        },
        data: { 
          lastTimestamp: now,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      // 这是非关键操作，记录警告但不抛出异常
      logger.warn('Failed to update last timestamp', error);
    }
  }
  
  /**
   * 获取服务状态
   */
  public getStatus(): {
    initialized: boolean;
    nodeConfig: NodeConfig | null;
    generatorConfig?: any;
  } {
    return {
      initialized: this.initialized,
      nodeConfig: this.nodeConfig,
      generatorConfig: this.generator?.getConfig()
    };
  }
  
  /**
   * 获取所有节点配置（管理用途）
   */
  public async getAllNodeConfigs(): Promise<any[]> {
    try {
      return await this.prisma.snowflakeConfig.findMany({
        orderBy: { nodeId: 'asc' }
      });
    } catch (error) {
      logger.error('Failed to get all node configs', error);
      throw error;
    }
  }
  
  /**
   * 停用当前节点
   */
  public async deactivateCurrentNode(): Promise<void> {
    if (!this.nodeConfig) {
      throw new Error('No active node config found');
    }
    
    try {
      await this.prisma.snowflakeConfig.updateMany({
        where: { 
          nodeId: this.nodeConfig.nodeId,
          isActive: true 
        },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });
      
      this.initialized = false;
      this.generator = null;
      this.nodeConfig = null;
      
      logger.info('Current node deactivated successfully');
    } catch (error) {
      logger.error('Failed to deactivate current node', error);
      throw error;
    }
  }
  
  /**
   * 清理非活跃的旧配置（管理用途）
   */
  public async cleanupInactiveConfigs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await this.prisma.snowflakeConfig.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lt: cutoffDate
          }
        }
      });
      
      logger.info(`Cleaned up ${result.count} inactive snowflake configs`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup inactive configs', error);
      throw error;
    }
  }
  
  /**
   * 关闭服务
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.nodeConfig) {
        await this.updateLastTimestamp();
      }
      
      await this.prisma.$disconnect();
      
      this.initialized = false;
      this.generator = null;
      this.nodeConfig = null;
      
      logger.info('Snowflake service shutdown completed');
    } catch (error) {
      logger.error('Error during snowflake service shutdown', error);
      throw error;
    }
  }
}