/**
 * 版本比较API接口
 * 提供模板版本间的差异比较功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SnowflakeService } from '@/lib/snowflakeService';
import { TemplateTraceService } from '@/lib/templateTraceService';
import { logger } from '@/lib/logger';

const snowflakeService = SnowflakeService.getInstance();
const traceService = TemplateTraceService.getInstance();

/**
 * GET /api/trace/[traceId]/compare - 比较两个版本的差异
 * Query params: fromVersion, toVersion
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
    const fromVersion = parseInt(searchParams.get('fromVersion') || '1');
    const toVersion = parseInt(searchParams.get('toVersion') || '2');

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

    // 验证版本号
    if (fromVersion < 1 || toVersion < 1 || fromVersion === toVersion) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的版本号'
        },
        { status: 400 }
      );
    }

    // 获取两个版本的快照
    const [fromSnapshot, toSnapshot] = await Promise.all([
      traceService.getTemplateSnapshot(traceId, fromVersion),
      traceService.getTemplateSnapshot(traceId, toVersion)
    ]);

    if (!fromSnapshot || !toSnapshot) {
      return NextResponse.json(
        {
          success: false,
          message: '指定版本的快照不存在'
        },
        { status: 404 }
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

    // 比较版本差异
    const comparison = traceService.compareVersions(fromSnapshot, toSnapshot);

    return NextResponse.json({
      success: true,
      data: {
        traceId,
        fromVersion: {
          number: fromVersion,
          dataHash: fromSnapshot.dataHash,
          createdAt: fromSnapshot.createdAt
        },
        toVersion: {
          number: toVersion,
          dataHash: toSnapshot.dataHash,
          createdAt: toSnapshot.createdAt
        },
        comparison: {
          hasChanges: comparison.hasChanges,
          changesCount: comparison.changes.length,
          changes: comparison.changes
        }
      }
    });
  } catch (error) {
    logger.error('版本比较失败:', { 
      traceId: (await params).traceId, 
      fromVersion: request.nextUrl.searchParams.get('fromVersion'),
      toVersion: request.nextUrl.searchParams.get('toVersion'),
      error 
    });
    return NextResponse.json(
      {
        success: false,
        message: '版本比较失败'
      },
      { status: 500 }
    );
  }
}