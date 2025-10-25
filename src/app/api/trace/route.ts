/**
 * 追溯系统API接口
 * 提供追溯ID生成、查询和统计功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SnowflakeService } from '@/lib/snowflakeService';
import { TemplateTraceService } from '@/lib/templateTraceService';
import { logger } from '@/lib/logger';

const snowflakeService = SnowflakeService.getInstance();
const traceService = TemplateTraceService.getInstance();

/**
 * GET /api/trace - 获取追溯统计信息
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeGlobal = searchParams.get('global') === 'true';

    // 如果请求全局统计，需要版主权限
    if (includeGlobal && user.role !== 'MODERATOR') {
      return NextResponse.json(
        {
          success: false,
          message: '权限不足'
        },
        { status: 403 }
      );
    }

    const targetUserId = includeGlobal ? undefined : (userId || user.id);
    const statistics = await traceService.getTraceStatistics(targetUserId);

    return NextResponse.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('获取追溯统计失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取追溯统计失败'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trace/generate - 生成新的追溯ID
 */
export async function POST(request: NextRequest) {
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

    const traceId = await snowflakeService.generateTraceId();

    logger.info(`Generated new trace ID for user ${user.id}`, {
      traceId,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        traceId,
        generatedAt: new Date().toISOString(),
        userId: user.id
      }
    });
  } catch (error) {
    logger.error('生成追溯ID失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '生成追溯ID失败'
      },
      { status: 500 }
    );
  }
}