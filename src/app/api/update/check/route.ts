import { NextRequest, NextResponse } from 'next/server';
import { VersionConfig, VersionCheckResponse, UpdateType } from '@/types/version';
import versionConfig from '@/config/version.json';

/**
 * 检查应用更新
 * GET /api/update/check
 */
export async function GET(request: NextRequest) {
  try {
    const currentVersion = request.headers.get('X-Current-Version');
    
    if (!currentVersion) {
      return NextResponse.json(
        { success: false, message: '缺少当前版本信息' },
        { status: 400 }
      );
    }

    const config = versionConfig as VersionConfig;
    const latestVersion = config.version;
    
    // 比较版本号
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    
    if (!hasUpdate) {
      const response: VersionCheckResponse = {
        success: true,
        data: {
          currentVersion,
          latestVersion,
          hasUpdate: false,
          updateType: 'patch',
          updatePriority: 'normal',
          forceRefresh: false
        }
      };
      return NextResponse.json(response);
    }

    // 确定更新类型
    const updateType = getUpdateType(currentVersion, latestVersion);
    const updateTypeConfig = config.updatePolicy.updateTypes[updateType];
    
    // 获取更新日志
    const changelog = config.changelog[latestVersion];
    
    const response: VersionCheckResponse = {
      success: true,
      data: {
        currentVersion,
        latestVersion,
        hasUpdate: true,
        updateType,
        updatePriority: updateTypeConfig.priority,
        changelog,
        forceRefresh: updateTypeConfig.forceRefresh
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Check update error:', error);
    return NextResponse.json(
      { success: false, message: '检查更新失败' },
      { status: 500 }
    );
  }
}

/**
 * 手动触发更新检查
 * POST /api/update/check
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentVersion, forceCheck = false } = body;
    
    if (!currentVersion) {
      return NextResponse.json(
        { success: false, message: '缺少当前版本信息' },
        { status: 400 }
      );
    }

    const config = versionConfig as VersionConfig;
    const latestVersion = config.version;
    
    // 如果不是强制检查，可以添加缓存逻辑
    if (!forceCheck) {
      // 这里可以添加缓存检查逻辑，避免频繁请求
      // 例如：检查上次检查时间，如果间隔太短则返回缓存结果
    }
    
    // 比较版本号
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    
    if (!hasUpdate) {
      const response: VersionCheckResponse = {
        success: true,
        data: {
          currentVersion,
          latestVersion,
          hasUpdate: false,
          updateType: 'patch',
          updatePriority: 'normal',
          forceRefresh: false
        },
        message: '当前已是最新版本'
      };
      return NextResponse.json(response);
    }

    // 确定更新类型
    const updateType = getUpdateType(currentVersion, latestVersion);
    const updateTypeConfig = config.updatePolicy.updateTypes[updateType];
    
    // 获取更新日志
    const changelog = config.changelog[latestVersion];
    
    const response: VersionCheckResponse = {
      success: true,
      data: {
        currentVersion,
        latestVersion,
        hasUpdate: true,
        updateType,
        updatePriority: updateTypeConfig.priority,
        changelog,
        forceRefresh: updateTypeConfig.forceRefresh
      },
      message: `发现新版本 ${latestVersion}`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Manual check update error:', error);
    return NextResponse.json(
      { success: false, message: '检查更新失败' },
      { status: 500 }
    );
  }
}

/**
 * 比较版本号
 * @param version1 版本1
 * @param version2 版本2
 * @returns 1: version1 > version2, -1: version1 < version2, 0: 相等
 */
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

/**
 * 获取更新类型
 * @param currentVersion 当前版本
 * @param latestVersion 最新版本
 * @returns 更新类型
 */
function getUpdateType(currentVersion: string, latestVersion: string): UpdateType {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);
  
  if (latest[0] > current[0]) return 'major';
  if (latest[1] > current[1]) return 'minor';
  return 'patch';
}