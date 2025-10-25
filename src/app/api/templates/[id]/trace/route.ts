/**
 * 模板追溯历史API接口
 * 提供特定模板的追溯历史查询功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { TemplateTraceService } from '@/lib/templateTraceService';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const traceService = TemplateTraceService.getInstance();

// Define types for trace data
interface TraceWithUser {
  id: string;
  traceId: string;
  operationType: string;
  userId: string;
  operationTime: Date;
  changeSummary: Record<string, unknown>;
  user?: {
    username?: string;
    gameNickname?: string;
  };
}

interface SnapshotData {
  id: string;
  versionNumber: number;
  snapshotData: Record<string, unknown>;
  createdAt: Date;
}

/**
 * GET /api/templates/[id]/trace - 获取指定模板的追溯历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '用户未登录'
        },
        { status: 401 }
      );
    }

    const { id: templateId } = await params;

    // 验证模板ID格式
    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: '无效的模板ID'
        },
        { status: 400 }
      );
    }

    // 获取模板信息
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            gameNickname: true
          }
        },
        pokemon: {
          select: {
            nameChinese: true,
            nameEnglish: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: '模板不存在'
        },
        { status: 404 }
      );
    }

    // 检查权限：只有模板创建者可以查看追溯历史
    const hasPermission = template.userId === user.id;

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: '权限不足'
        },
        { status: 403 }
      );
    }

    // 如果模板没有追溯ID，返回空历史
    if (!template.traceId) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 获取追溯历史
    const traceHistory = await traceService.getTemplateTraceHistory(template.traceId);

    // 转换数据格式以匹配前端组件期望的结构
    const formattedTraces = traceHistory.traces.map((trace: any, index: number) => {
      const matchingSnapshot = traceHistory.snapshots[index] || traceHistory.snapshots[0];
      
      return {
        id: trace.id,
        traceId: trace.traceId,
        operation: trace.operationType,
        operatorId: trace.userId,
        operatorName: trace.user?.username || trace.user?.gameNickname,
        timestamp: trace.operationTime.toISOString(),
        metadata: trace.changeSummary,
        snapshot: matchingSnapshot ? {
          id: matchingSnapshot.id,
          data: matchingSnapshot.snapshotData,
          createdAt: matchingSnapshot.createdAt.toISOString()
        } : undefined
      };
    });

    logger.info('获取模板追溯历史成功', {
      templateId,
      traceId: template.traceId,
      tracesCount: formattedTraces.length,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: formattedTraces
    });

  } catch (error) {
    logger.error('获取模板追溯历史失败:', { 
      templateId: (await params).id, 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      {
        success: false,
        message: '获取追溯历史失败'
      },
      { status: 500 }
    );
  }
}