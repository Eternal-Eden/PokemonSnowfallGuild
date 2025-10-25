/**
 * 模板追溯服务
 * 负责处理模板的追溯记录和快照管理
 */

import { PrismaClient } from '@prisma/client';
import { SnowflakeService } from './snowflakeService';
import { logger } from './logger';
import crypto from 'crypto';

export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface EVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Move {
  id: number;
  name: string;
  type: string;
  category: string;
  power?: number;
  accuracy?: number;
  pp: number;
}

export interface TemplateData {
  name: string;
  level: number;
  nature: string;
  ability: string | null;
  item: string | null;
  ivs: IVs;
  evs: EVs;
  pokemonId: number;
  moves?: Move[];
}

export interface TraceRecord {
  id: string;
  traceId: string;
  templateId: string;
  userId: string;
  operationType: string;
  operationTime: Date;
  ipAddress?: string;
  userAgent?: string;
  changeSummary?: Record<string, unknown>;
}

export interface TemplateSnapshot {
  id: string;
  traceId: string;
  templateId: string;
  versionNumber: number;
  dataHash: string;
  snapshotData: TemplateData;
  createdAt: Date;
}

export interface DeletedTemplate {
  traceId: string;
  originalTemplateId: string;
  deletedAt: Date;
  deleteUserId: string;
  freezeUntil: Date;
}

export interface ChangeRecord {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

export interface TraceMetadata {
  ipAddress?: string;
  userAgent?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface TraceStatistics {
  totalTraces: number;
  totalSnapshots: number;
  operationCounts: Record<string, number>;
  recentActivity: Array<{
    operationType: string;
    operationTime: Date;
    userId: string;
    templateId: string;
  }>;
}

export interface TemplateInfo {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export class TemplateTraceService {
  private static instance: TemplateTraceService;
  private prisma: PrismaClient;
  private snowflakeService: SnowflakeService;

  private constructor() {
    this.prisma = new PrismaClient();
    this.snowflakeService = SnowflakeService.getInstance();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TemplateTraceService {
    if (!TemplateTraceService.instance) {
      TemplateTraceService.instance = new TemplateTraceService();
    }
    return TemplateTraceService.instance;
  }

  /**
   * 生成追溯ID
   */
  public async generateTraceId(): Promise<string> {
    return this.snowflakeService.generateId();
  }

  /**
   * 创建模板追溯记录
   */
  public async createTemplateTrace(
    templateId: string,
    userId: string,
    templateData: TemplateData,
    metadata?: TraceMetadata
  ): Promise<string> {
    try {
      const traceId = await this.generateTraceId();
      const dataHash = this.calculateDataHash(templateData);

      await this.prisma.$transaction(async (tx) => {
        // 创建追溯记录
        await tx.templateTrace.create({
          data: {
            id: await this.snowflakeService.generateId(),
            traceId,
            templateId,
            userId,
            operationType: 'CREATE',
            operationTime: new Date(),
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            changeSummary: metadata?.additionalInfo as any,
          },
        });

        // 创建快照
        await tx.templateSnapshot.create({
          data: {
            id: await this.snowflakeService.generateId(),
            traceId,
            templateId,
            versionNumber: 1,
            dataHash,
            snapshotData: templateData as any,
            createdAt: new Date(),
          },
        });
      });

      logger.info('Template trace created', { traceId, templateId, userId });
      return traceId;
    } catch (error) {
      logger.error('Failed to create template trace', { error, templateId, userId });
      throw error;
    }
  }

  /**
   * 更新模板追溯记录
   */
  public async updateTemplateTrace(
    templateId: string,
    userId: string,
    oldTemplateData: TemplateData,
    newTemplateData: TemplateData,
    metadata?: TraceMetadata
  ): Promise<void> {
    try {
      // 获取现有的追溯ID
      const existingTrace = await this.prisma.templateTrace.findFirst({
        where: { templateId },
        orderBy: { operationTime: 'desc' },
      });

      if (!existingTrace) {
        throw new Error('No existing trace found for template');
      }

      const newDataHash = this.calculateDataHash(newTemplateData);
      const oldDataHash = this.calculateDataHash(oldTemplateData);

      // 如果数据没有变化，不创建新记录
      if (newDataHash === oldDataHash) {
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        // 创建新的追溯记录
        await tx.templateTrace.create({
          data: {
            id: await this.snowflakeService.generateId(),
            traceId: existingTrace.traceId,
            templateId,
            userId,
            operationType: 'UPDATE',
            operationTime: new Date(),
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            changeSummary: metadata?.additionalInfo as any,
          },
        });

        // 获取最新版本号
        const latestSnapshot = await tx.templateSnapshot.findFirst({
          where: { traceId: existingTrace.traceId },
          orderBy: { versionNumber: 'desc' },
        });

        const nextVersion = (latestSnapshot?.versionNumber || 0) + 1;

        // 创建新快照
        await tx.templateSnapshot.create({
          data: {
            id: await this.snowflakeService.generateId(),
            traceId: existingTrace.traceId,
            templateId,
            versionNumber: nextVersion,
            dataHash: newDataHash,
            snapshotData: newTemplateData as any,
            createdAt: new Date(),
          },
        });
      });

      logger.info('Template trace updated', { 
        traceId: existingTrace.traceId, 
        templateId, 
        userId 
      });
    } catch (error) {
      logger.error('Failed to update template trace', { error, templateId, userId });
      throw error;
    }
  }

  /**
   * 删除模板追溯记录
   */
  public async deleteTemplateTrace(
    traceId: string,
    userId: string,
    templateId: string,
    metadata?: TraceMetadata
  ): Promise<void> {
    try {
      const freezeUntil = new Date();
      freezeUntil.setDate(freezeUntil.getDate() + 30); // 冻结30天

      await this.prisma.$transaction(async (tx) => {
        // 创建删除记录
        await tx.templateTrace.create({
          data: {
            id: await this.snowflakeService.generateId(),
            traceId,
            templateId,
            userId,
            operationType: 'DELETE',
            operationTime: new Date(),
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            changeSummary: metadata?.additionalInfo as any,
          },
        });

        // TODO: 添加到删除表 (需要创建 deletedTemplate 表)
        // await tx.deletedTemplate.create({
        //   data: {
        //     traceId,
        //     originalTemplateId: templateId,
        //     deletedAt: new Date(),
        //     deleteUserId: userId,
        //     freezeUntil,
        //   },
        // });
      });

      logger.info('Template trace deleted', { traceId, templateId, userId });
    } catch (error) {
      logger.error('Failed to delete template trace', { error, traceId, userId });
      throw error;
    }
  }

  /**
   * 获取模板追溯历史
   */
  public async getTemplateTraceHistory(traceId: string): Promise<{
    traces: TraceRecord[];
    snapshots: TemplateSnapshot[];
    templateInfo?: TemplateInfo;
  }> {
    try {
      const [traces, snapshots, templateInfo] = await Promise.all([
        this.prisma.templateTrace.findMany({
          where: { traceId },
          orderBy: { operationTime: 'asc' },
        }),
        this.prisma.templateSnapshot.findMany({
          where: { traceId },
          orderBy: { versionNumber: 'asc' },
        }),
        this.prisma.template.findFirst({
          where: {
            traces: {
              some: { traceId }
            }
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
          }
        })
      ]);

      return {
        traces: traces.map(trace => ({
          ...trace,
          changeSummary: trace.changeSummary as Record<string, unknown> | undefined
        })) as TraceRecord[],
        snapshots: snapshots.map(snapshot => ({
          ...snapshot,
          snapshotData: snapshot.snapshotData as any
        })) as TemplateSnapshot[],
        templateInfo: templateInfo as TemplateInfo | undefined
      };
    } catch (error) {
      logger.error('Failed to get template trace history', { error, traceId });
      throw error;
    }
  }

  /**
   * 获取特定版本的快照
   */
  public async getTemplateSnapshot(traceId: string, versionNumber: number): Promise<TemplateSnapshot | null> {
    try {
      const snapshot = await this.prisma.templateSnapshot.findFirst({
        where: {
          traceId,
          versionNumber,
        },
      });

      if (!snapshot) {
        return null;
      }

      return {
        ...snapshot,
        snapshotData: snapshot.snapshotData as any
      };
    } catch (error) {
      logger.error('Failed to get template snapshot', { error, traceId, versionNumber });
      throw error;
    }
  }

  /**
   * 比较两个版本的差异
   */
  public compareVersions(
    oldSnapshot: TemplateSnapshot,
    newSnapshot: TemplateSnapshot
  ): {
    hasChanges: boolean;
    changes: ChangeRecord[];
  } {
    const changes: ChangeRecord[] = [];
    const oldData = oldSnapshot.snapshotData;
    const newData = newSnapshot.snapshotData;

    // 比较基本字段
    const fieldsToCompare = ['name', 'level', 'nature', 'ability', 'item', 'pokemonId'];
    
    for (const field of fieldsToCompare) {
      const oldValue = (oldData as any)[field];
      const newValue = (newData as any)[field];
      
      if (oldValue !== newValue) {
        changes.push({
          field,
          oldValue,
          newValue,
          changeType: this.getChangeType(oldValue, newValue),
        });
      }
    }

    // 比较IVs
    if (oldData.ivs && newData.ivs) {
      for (const stat of ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']) {
        const oldValue = (oldData.ivs as any)[stat];
        const newValue = (newData.ivs as any)[stat];
        
        if (oldValue !== newValue) {
          changes.push({
            field: `ivs.${stat}`,
            oldValue,
            newValue,
            changeType: this.getChangeType(oldValue, newValue),
          });
        }
      }
    }

    // 比较EVs
    if (oldData.evs && newData.evs) {
      for (const stat of ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']) {
        const oldValue = (oldData.evs as any)[stat];
        const newValue = (newData.evs as any)[stat];
        
        if (oldValue !== newValue) {
          changes.push({
            field: `evs.${stat}`,
            oldValue,
            newValue,
            changeType: this.getChangeType(oldValue, newValue),
          });
        }
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
    };
  }

  /**
   * 清理过期的删除记录
   */
  public async cleanupExpiredDeletions(): Promise<number> {
    try {
      // TODO: Implement deletedTemplate table in Prisma schema
      logger.warn('cleanupExpiredDeletions not implemented - deletedTemplate table missing');
      return 0;
      
      /* 
      const now = new Date();
      
      // 获取过期的删除记录
      const expiredDeletions = await this.prisma.deletedTemplate.findMany({
        where: {
          freezeUntil: {
            lt: now,
          },
        },
      });

      if (expiredDeletions.length === 0) {
        return 0;
      }

      // 删除相关的追溯记录和快照
      await this.prisma.$transaction(async (tx) => {
        for (const deletion of expiredDeletions) {
          // 删除快照
          await tx.templateSnapshot.deleteMany({
            where: { traceId: deletion.traceId },
          });

          // 删除追溯记录
          await tx.templateTrace.deleteMany({
            where: { traceId: deletion.traceId },
          });

          // 删除删除记录本身
          await tx.deletedTemplate.delete({
            where: { traceId: deletion.traceId },
          });
        }
      });

      logger.info('Cleaned up expired deletions', { count: expiredDeletions.length });
      return expiredDeletions.length;
      */
    } catch (error) {
      logger.error('Failed to cleanup expired deletions', { error });
      throw error;
    }
  }

  /**
   * 计算数据哈希
   */
  private calculateDataHash(templateData: TemplateData): string {
    // 创建一个标准化的数据对象用于哈希计算
    const normalizedData = {
      name: templateData.name,
      level: templateData.level,
      nature: templateData.nature,
      ability: templateData.ability,
      item: templateData.item,
      pokemonId: templateData.pokemonId,
      ivs: templateData.ivs,
      evs: templateData.evs,
      moves: templateData.moves || [],
    };

    // 将对象转换为JSON字符串并计算哈希
    const dataString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * 获取变更类型
   */
  private getChangeType(oldValue: unknown, newValue: unknown): 'added' | 'removed' | 'modified' {
    if (oldValue === null || oldValue === undefined) {
      return 'added';
    }
    if (newValue === null || newValue === undefined) {
      return 'removed';
    }
    return 'modified';
  }

  /**
   * 获取追溯统计信息
   */
  public async getTraceStatistics(userId?: string): Promise<TraceStatistics> {
    try {
      const whereClause = userId ? { userId } : {};

      const [totalTraces, totalSnapshots, operationCounts, recentActivity] = await Promise.all([
        this.prisma.templateTrace.count({ where: whereClause }),
        this.prisma.templateSnapshot.count(),
        this.prisma.templateTrace.groupBy({
          by: ['operationType'],
          where: whereClause,
          _count: { operationType: true },
        }),
        this.prisma.templateTrace.findMany({
          where: whereClause,
          orderBy: { operationTime: 'desc' },
          take: 10,
          select: {
            operationType: true,
            operationTime: true,
            userId: true,
            templateId: true,
          },
        }),
      ]);

      const operationCountsMap: Record<string, number> = {};
      operationCounts.forEach(item => {
        operationCountsMap[item.operationType] = item._count.operationType || 0;
      });

      return {
        totalTraces,
        totalSnapshots,
        operationCounts: operationCountsMap,
        recentActivity,
      };
    } catch (error) {
      logger.error('Failed to get trace statistics', { error, userId });
      throw error;
    }
  }
}