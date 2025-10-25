'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User, LoginRequest, ChangePasswordRequest, CreateUserRequest, RegisterRequest } from '@/types/auth';
// 移除服务器端auth模块的导入，使用客户端API调用

// 认证动作类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// 认证reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// 认证上下文类型
interface AuthContextType {
  state: AuthState;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; requirePasswordChange?: boolean; message?: string; needTwoFactor?: boolean }>;
  logout: () => void;
  changePassword: (data: ChangePasswordRequest) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  // 注册功能
  register: (registerData: RegisterRequest) => Promise<{ success: boolean; user?: User; message?: string }>;
  // 用户管理功能
  createUser: (userData: CreateUserRequest) => Promise<{ success: boolean; user?: User; message?: string }>;
  getAllUsers: () => Promise<{ success: boolean; users?: User[]; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<{ success: boolean; user?: User; message?: string }>;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 从localStorage恢复认证状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // 登录函数 - 调用真正的后端API
  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // 调用后端登录API
      const response = await fetch('/api/auth/login-or-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          email: credentials.email,
          twoFactorCode: credentials.twoFactorCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '登录失败');
      }

      const data = await response.json();
      
      if (!data.success || !data.token) {
        throw new Error(data.message || '登录响应格式错误');
      }
      
      const { token, user } = data;
      
      // 保存token到localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      // 更新认证状态
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email || `${user.username}@domain.com`,
            role: user.role,
            groups: user.groups || [],
            permissions: user.permissions || [],
            isDefaultPassword: user.isDefaultPassword || false,
            requirePasswordChange: user.requirePasswordChange || false,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
          },
          token
        }
      });
      
      return {
        success: true,
        requirePasswordChange: user.requirePasswordChange || false,
        message: data.message || '登录成功'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请稍后重试';
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    dispatch({ type: 'LOGOUT' });
  };

  // 修改密码函数
  const changePassword = async (data: ChangePasswordRequest) => {
    if (!state.user) {
      return { success: false, message: '用户未登录' };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' };
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedUser = {
          ...state.user,
          isDefaultPassword: false,
          requirePasswordChange: false,
          updatedAt: new Date()
        };
        
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        
        return { success: true, message: '密码修改成功' };
      } else {
        return { success: false, message: result.message || '密码修改失败' };
      }
    } catch (error) {
      return { success: false, message: '密码修改失败，请稍后重试' };
    }
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 注册函数
  const register = async (registerData: RegisterRequest) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('/api/auth/login-or-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          ...registerData
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.token) {
        const { token, user } = result;
        
        // 保存到localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        
        return {
          success: true,
          user,
          message: result.message || '注册成功'
        };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: result.message || '注册失败' });
        return {
          success: false,
          message: result.message || '注册失败'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试';
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 创建用户
  const createUserFunc = async (userData: CreateUserRequest) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        user: result.user,
        message: result.message || (result.success ? '用户创建成功' : '用户创建失败')
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败'
      };
    }
  };

  // 获取所有用户
  const getAllUsersFunc = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        users: result.users,
        message: result.message || (result.success ? '获取用户列表成功' : '获取用户列表失败')
      };
    } catch (error) {
      return {
        success: false,
        message: '获取用户列表失败'
      };
    }
  };

  // 删除用户
  const deleteUserFunc = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message || (result.success ? '用户删除成功' : '用户删除失败')
      };
    } catch (error) {
      return {
        success: false,
        message: '用户删除失败'
      };
    }
  };

  // 重置用户密码
  const resetUserPasswordFunc = async (userId: string, newPassword: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message || (result.success ? '密码重置成功' : '密码重置失败')
      };
    } catch (error) {
      return {
        success: false,
        message: '密码重置失败'
      };
    }
  };

  // 更新用户
  const updateUserFunc = async (userId: string, userData: Partial<User>) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        user: result.user,
        message: result.message || (result.success ? '用户更新成功' : '用户更新失败')
      };
    } catch (error) {
      return {
        success: false,
        message: '用户更新失败'
      };
    }
  };

  const value: AuthContextType = {
    state,
    user: state.user,
    login,
    logout,
    changePassword,
    clearError,
    register,
    createUser: createUserFunc,
    getAllUsers: getAllUsersFunc,
    deleteUser: deleteUserFunc,
    resetUserPassword: resetUserPasswordFunc,
    updateUser: updateUserFunc
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}