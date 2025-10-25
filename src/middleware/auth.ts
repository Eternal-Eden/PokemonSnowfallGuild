import { NextRequest, NextResponse } from 'next/server';
import { UserRole, Permission } from '@/types/auth';

// 模拟用户会话数据
interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastActivity: Date;
}

// 模拟会话存储（实际应用中应使用 Redis 或数据库）
const mockSessions: Map<string, UserSession> = new Map([
  ['moderator_session_789', {
    id: 'moderator1',
    username: 'moderator1',
    email: 'moderator1@luoxue.com',
    role: UserRole.MODERATOR,
    permissions: [Permission.USER_READ, Permission.FORUM_MODERATE, Permission.FORUM_MANAGE_POSTS],
    isActive: true,
    lastActivity: new Date(),
  }],
  ['user_session_456', {
    id: 'user1',
    username: 'user1',
    email: 'user1@luoxue.com',
    role: UserRole.USER,
    permissions: [Permission.USER_READ],
    isActive: true,
    lastActivity: new Date(),
  }],
]);

// 角色权限映射
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.MODERATOR]: [Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE, Permission.SYSTEM_CONFIG, Permission.SYSTEM_LOGS, Permission.STATS_VIEW, Permission.STATS_EXPORT, Permission.VIEW_REPORTS, Permission.MANAGE_REPORTS, Permission.CREATE_REPORTS, Permission.EDIT_REPORTS, Permission.DELETE_REPORTS, Permission.EXPORT_REPORTS, Permission.FORUM_MODERATE, Permission.FORUM_MANAGE_POSTS, Permission.FORUM_MANAGE_ACTIVITIES, Permission.FORUM_CREATE_ACTIVITIES, Permission.FORUM_DELETE_POSTS],
  [UserRole.USER]: [Permission.USER_READ],
  [UserRole.MEMBER]: [Permission.USER_READ],
};

// API 路径权限要求
const apiPermissions: Record<string, Permission[]> = {
  // 用户管理
  '/api/users': [Permission.USER_READ],
  '/api/users/[id]': [Permission.USER_READ],
  
  // 论坛管理
  '/api/forum/posts': [Permission.USER_READ],
  '/api/forum/posts/[id]': [Permission.USER_READ],
  
  // 系统配置（仅超级管理员）
  '/api/system/config': [Permission.SYSTEM_CONFIG],
  '/api/system/logs': [Permission.SYSTEM_LOGS],
};

/**
 * 验证用户会话
 */
export function validateSession(sessionToken: string): UserSession | null {
  const session = mockSessions.get(sessionToken);
  
  if (!session) {
    return null;
  }
  
  // 检查会话是否过期（24小时）
  const sessionAge = Date.now() - session.lastActivity.getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24小时
  
  if (sessionAge > maxAge) {
    mockSessions.delete(sessionToken);
    return null;
  }
  
  // 检查用户是否活跃
  if (!session.isActive) {
    return null;
  }
  
  // 更新最后活动时间
  session.lastActivity = new Date();
  
  return session;
}

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(user: UserSession, requiredPermissions: Permission[]): boolean {
  // 版主拥有所有权限
  if (user.role === UserRole.MODERATOR) {
    return true;
  }
  
  // 检查用户是否拥有所需的所有权限
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission)
  );
}

/**
 * 获取API路径所需的权限
 */
export function getRequiredPermissions(pathname: string): Permission[] {
  // 精确匹配
  if (apiPermissions[pathname]) {
    return apiPermissions[pathname];
  }
  
  // 动态路由匹配
  for (const [pattern, permissions] of Object.entries(apiPermissions)) {
    if (pattern.includes('[id]')) {
      const regex = new RegExp(pattern.replace(/\[id\]/g, '[^/]+'));
      if (regex.test(pathname)) {
        return permissions;
      }
    }
  }
  
  // 默认需要读取权限
  return [Permission.USER_READ];
}

/**
 * 认证中间件
 */
export function authMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // 跳过非API路径，因为admin API已被移除
  if (!pathname.startsWith('/api/')) {
    return null;
  }
  
  // 获取会话令牌
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                      request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return NextResponse.json(
      { success: false, error: '未提供认证令牌' },
      { status: 401 }
    );
  }
  
  // 验证会话
  const user = validateSession(sessionToken);
  if (!user) {
    return NextResponse.json(
      { success: false, error: '无效或已过期的会话' },
      { status: 401 }
    );
  }
  
  // 获取所需权限
  const requiredPermissions = getRequiredPermissions(pathname);
  
  // 检查权限
  if (!hasPermission(user, requiredPermissions)) {
    return NextResponse.json(
      { 
        success: false, 
        error: '权限不足',
        required: requiredPermissions,
        current: user.permissions 
      },
      { status: 403 }
    );
  }
  
  // 在请求头中添加用户信息，供后续处理使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-permissions', JSON.stringify(user.permissions));
  
  return null; // 继续处理请求
}

/**
 * 权限检查装饰器函数
 */
export function requirePermissions(permissions: Permission[]) {
  return function(handler: Function) {
    return async function(request: NextRequest, ...args: any[]) {
      const authResult = authMiddleware(request);
      if (authResult) {
        return authResult;
      }
      
      // 从请求头获取用户信息
      const userId = request.headers.get('x-user-id');
      const userRole = request.headers.get('x-user-role') as UserRole;
      const userPermissions = JSON.parse(request.headers.get('x-user-permissions') || '[]');
      
      const user: UserSession = {
        id: userId!,
        username: '',
        email: '',
        role: userRole,
        permissions: userPermissions,
        isActive: true,
        lastActivity: new Date(),
      };
      
      if (!hasPermission(user, permissions)) {
        return NextResponse.json(
          { 
            success: false, 
            error: '权限不足',
            required: permissions,
            current: userPermissions 
          },
          { status: 403 }
        );
      }
      
      return handler(request, ...args);
    };
  };
}

/**
 * 创建会话（登录）
 */
export function createSession(user: Omit<UserSession, 'permissions' | 'lastActivity'>): string {
  const sessionToken = `session_${user.id}_${Date.now()}`;
  const permissions = rolePermissions[user.role] || [];
  
  const session: UserSession = {
    ...user,
    permissions,
    lastActivity: new Date(),
  };
  
  mockSessions.set(sessionToken, session);
  return sessionToken;
}

/**
 * 销毁会话（登出）
 */
export function destroySession(sessionToken: string): boolean {
  return mockSessions.delete(sessionToken);
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(sessionToken: string): UserSession | null {
  return validateSession(sessionToken);
}

/**
 * 更新用户权限
 */
export function updateUserPermissions(userId: string, newRole: UserRole): boolean {
  for (const [token, session] of mockSessions.entries()) {
    if (session.id === userId) {
      session.role = newRole;
      session.permissions = rolePermissions[newRole] || [];
      return true;
    }
  }
  return false;
}