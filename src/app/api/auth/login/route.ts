import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/middleware/auth';
import { UserRole } from '@/types/auth';

// 模拟用户数据
const mockUsers = [
  {
    id: 'editor1',
    username: 'editor1',
    email: 'editor1@luoxue.com',
    password: 'editor123',
    role: 'editor' as UserRole,
    isActive: true,
  },
  {
    id: 'moderator1',
    username: 'moderator1',
    email: 'moderator1@luoxue.com',
    password: 'moderator123',
    role: 'moderator' as UserRole,
    isActive: true,
  },
  {
    id: 'user1',
    username: 'user1',
    email: 'user1@luoxue.com',
    password: 'user123',
    role: 'user' as UserRole,
    isActive: true,
  },
];

// 简单的密码验证函数（实际应用中应使用 bcrypt 等加密库）
function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  // 这里简化处理，实际应用中应该使用加密验证
  return plainPassword === hashedPassword;
}

// POST - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    // 验证必填字段
    if ((!username && !email) || !password) {
      return NextResponse.json(
        { success: false, error: '请提供用户名/邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = mockUsers.find(u => 
      (username && u.username === username) || 
      (email && u.email === email)
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      );
    }

    // 验证密码
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: '账户已被禁用' },
        { status: 401 }
      );
    }

    // 创建会话
    const sessionToken = createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    // 准备响应数据（不包含敏感信息）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // 创建响应
    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        token: sessionToken,
      },
      message: '登录成功',
    });

    // 设置 HTTP-only cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    );
  }
}

// GET - 获取登录状态
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                        request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 这里可以验证会话并返回用户信息
    // 为了简化，直接返回成功状态
    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        sessionToken,
      },
    });
  } catch (error) {
    console.error('获取登录状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取登录状态失败' },
      { status: 500 }
    );
  }
}