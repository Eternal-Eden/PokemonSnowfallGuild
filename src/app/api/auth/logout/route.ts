import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/middleware/auth';

// POST - 用户登出
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                        request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // 销毁会话
      destroySession(sessionToken);
    }

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    });

    // 清除 cookie
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登出失败:', error);
    return NextResponse.json(
      { success: false, error: '登出失败' },
      { status: 500 }
    );
  }
}

// GET - 登出（支持 GET 请求）
export async function GET(request: NextRequest) {
  return POST(request);
}