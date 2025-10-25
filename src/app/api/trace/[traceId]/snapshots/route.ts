/**
 * 快照查询API接口
 * 提供模板快照的查询功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SnowflakeService } from '@/lib/snowflakeService';
import { TemplateTraceService } from '@/lib/templateTraceService';
import { logger } from '@/lib/logger';

const snowflakeService = SnowflakeService.getInstance();
const traceService = TemplateTraceService.getInstance();

/**
 * GET /api/trace/[traceId]/snapshots - 获取所有快照列表
 * Query params: version (可选，获取特定版本)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ traceId: string }> }
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

    const { traceId } = await params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    // 验证追溯ID格式
    if (!snowflakeService.isValidTraceId(traceId)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的追溯ID格式'
        },
        { status: 400 }
      );
    }

    // 检查权限
    const traceHistory = await traceService.getTemplateTraceHistory(traceId);
    const hasPermission = traceHistory.templateInfo?.userId === user.id ||
      traceHistory.traces.some(trace => trace.userId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: '权限不足'
        },
        { status: 403 }
      );
    }

    if (version) {
      // 获取特定版本的快照
      const versionNumber = parseInt(version);
      if (isNaN(versionNumber) || versionNumber < 1) {
        return NextResponse.json(
          {
            success: false,
            message: '无效的版本号'
          },
          { status: 400 }
        );
      }

      const snapshot = await traceService.getTemplateSnapshot(traceId, versionNumber);
      if (!snapshot) {
        return NextResponse.json(
          {
            success: false,
            message: '指定版本的快照不存在'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          traceId,
          snapshot: {
            id: snapshot.id,
            versionNumber: snapshot.versionNumber,
            dataHash: snapshot.dataHash,
            templateData: snapshot.snapshotData,
            createdAt: snapshot.createdAt
          }
        }
      });
    } else {
      // 获取所有快照列表
      const snapshots = traceHistory.snapshots.map(snapshot => ({
        id: snapshot.id,
        versionNumber: snapshot.versionNumber,
        dataHash: snapshot.dataHash,
        createdAt: snapshot.createdAt,
        // 不返回完整的templateData，只返回摘要信息
        summary: {
          name: snapshot.snapshotData?.name,
          level: snapshot.snapshotData?.level,
          nature: snapshot.snapshotData?.nature,
          ability: snapshot.snapshotData?.ability,
          item: snapshot.snapshotData?.item
        }
      }));

      return NextResponse.json({
        success: true,
        data: {
          traceId,
          totalSnapshots: snapshots.length,
          snapshots
        }
      });
    }
  } catch (error) {
    logger.error('获取快照失败:', { 
      traceId: (await params).traceId, 
      version: request.nextUrl.searchParams.get('version'),
      error 
    });
    return NextResponse.json(
      {
        success: false,
        message: '获取快照失败'
      },
      { status: 500 }
    );
  }
}