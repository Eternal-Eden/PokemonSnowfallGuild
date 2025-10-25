import { NextRequest, NextResponse } from 'next/server';
import { VersionConfig, VersionCheckResponse, UpdateType } from '@/types/version';
import versionConfig from '@/config/version.json';

/**
 * 获取当前版本信息
 * GET /api/version
 */
export async function GET() {
  try {
    const config = versionConfig as VersionConfig;
    
    return NextResponse.json({
      success: true,
      data: {
        version: config.version,
        buildTime: config.buildTime,
        updatePolicy: config.updatePolicy
      }
    });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json(
      { success: false, message: '获取版本信息失败' },
      { status: 500 }
    );
  }
}

/**
 * 检查版本更新
 * POST /api/version
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentVersion } = body;
    
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
    console.error('Check version update error:', error);
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