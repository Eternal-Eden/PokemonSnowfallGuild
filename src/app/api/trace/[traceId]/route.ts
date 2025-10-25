/**
 * 追溯ID查询API接口
 * 提供特定追溯ID的详细信息查询
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SnowflakeService } from '@/lib/snowflakeService';
import { TemplateTraceService } from '@/lib/templateTraceService';
import { logger } from '@/lib/logger';

const snowflakeService = SnowflakeService.getInstance();
const traceService = TemplateTraceService.getInstance();

/**
 * GET /api/trace/[traceId] - 获取追溯ID的详细信息
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

    // 解析追溯ID
    const parsedId = snowflakeService.parseTraceId(traceId);

    // 获取追溯历史
    const traceHistory = await traceService.getTemplateTraceHistory(traceId);

    // 检查权限：只有模板创建者或相关操作者可以查看
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

    return NextResponse.json({
      success: true,
      data: {
        traceId,
        parsedId,
        history: traceHistory,
        metadata: {
          totalOperations: traceHistory.traces.length,
          totalVersions: traceHistory.snapshots.length,
          isDeleted: traceHistory.traces.some(t => t.operationType === 'DELETE'),
          lastOperation: traceHistory.traces[traceHistory.traces.length - 1]
        }
      }
    });
  } catch (error) {
    logger.error('获取追溯信息失败:', { traceId: (await params).traceId, error });
    return NextResponse.json(
      {
        success: false,
        message: '获取追溯信息失败'
      },
      { status: 500 }
    );
  }
}