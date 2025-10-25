import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/middleware/auth';

// GET - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                        request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌' },
        { status: 401 }
      );
    }

    // 获取当前用户信息
    const user = getCurrentUser(sessionToken);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '无效或已过期的会话' },
        { status: 401 }
      );
    }

    // 返回用户信息（不包含敏感数据）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      lastActivity: user.lastActivity,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}