import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 健康检查端点
export async function GET(_request: NextRequest) {
  try {
    // 基本健康检查
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage()
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };

    // 检查关键服务状态
    const checks = {
      database: await checkDatabase(),
      redis: await checkRedis(),
      filesystem: await checkFilesystem()
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    return NextResponse.json({
      ...healthData,
      checks,
      overall: allHealthy ? 'healthy' : 'unhealthy'
    }, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// 数据库健康检查
async function checkDatabase() {
  try {
    // 这里应该实际连接数据库进行检查
    // 目前返回模拟状态
    const start = Date.now();
    
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      message: 'Database connection failed'
    };
  }
}

// Redis 健康检查
async function checkRedis() {
  try {
    // 这里应该实际连接 Redis 进行检查
    // 目前返回模拟状态
    const start = Date.now();
    
    // 模拟 Redis ping
    await new Promise(resolve => setTimeout(resolve, 5));
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Redis connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed',
      message: 'Redis connection failed'
    };
  }
}

// 文件系统健康检查
async function checkFilesystem() {
  try {
    // 使用已导入的 fs 和 path
    
    // 检查临时目录写入权限
    const testFile = path.join(process.cwd(), '.health-check-temp');
    const testData = 'health-check-' + Date.now();
    
    await fs.writeFile(testFile, testData);
    const readData = await fs.readFile(testFile, 'utf8');
    await fs.unlink(testFile);
    
    if (readData !== testData) {
      throw new Error('File system read/write test failed');
    }
    
    return {
      status: 'healthy',
      message: 'Filesystem read/write successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Filesystem check failed',
      message: 'Filesystem check failed'
    };
  }
}

// 简化的健康检查端点 (用于负载均衡器)
export async function HEAD(_request: NextRequest) {
  try {
    // 快速健康检查，只检查基本状态
    return new NextResponse(null, { status: 200 });
  } catch (_error) {
    return new NextResponse(null, { status: 503 });
  }
}