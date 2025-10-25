'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Snowflake, Shield, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface LoginPageProps {
  onLoginSuccess: (requirePasswordChange: boolean) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, state, clearError } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    email: '',
    twoFactorCode: ''
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // 验证所有字段
    const errors: {[key: string]: string} = {};
    errors.username = validateField('username', formData.username);
    errors.password = validateField('password', formData.password);
    errors.email = validateField('email', formData.email);
    
    // 过滤掉空错误
    const validErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, error]) => error !== '')
    );
    
    setValidationErrors(validErrors);
    
    // 如果有验证错误，不提交表单
    if (Object.keys(validErrors).length > 0) {
      return;
    }
    
    // 使用完整的登录数据
    const loginData = {
      username: formData.username.trim(),
      password: formData.password,
      email: formData.email.trim(),
      twoFactorCode: formData.twoFactorCode
    };
    
    const result = await login(loginData);
    if (result.success) {
      onLoginSuccess(false);
    }
  };

  const validateField = (field: keyof LoginRequest, value: string): string => {
    switch (field) {
      case 'username':
        if (!value.trim()) return '用户名不能为空';
        if (value.length < 3) return '用户名至少需要3个字符';
        if (value.length > 50) return '用户名不能超过50个字符';
        return '';
      case 'password':
        if (!value) return '密码不能为空';
        if (value.length < 6) return '密码至少需要6个字符';
        return '';
      case 'email':
        if (!value.trim()) return '邮箱不能为空';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return '请输入有效的邮箱地址';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 实时验证
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    if (state.error) clearError();
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute top-10 left-10 text-blue-200 dark:text-blue-800 opacity-20"
        >
          <Snowflake size={60} />
        </motion.div>
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute top-1/4 right-20 text-purple-200 dark:text-purple-800 opacity-20"
        >
          <Snowflake size={80} />
        </motion.div>
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.15, 1]
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute bottom-20 left-1/4 text-indigo-200 dark:text-indigo-800 opacity-20"
        >
          <Snowflake size={70} />
        </motion.div>
      </div>

      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* 卡片背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
        
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
          {/* 标题区域 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              落雪公会
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pokemon Snowfall Guild
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              会员登录
            </p>
            

          </motion.div>



          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">


            {/* 用户名输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 ${
                    validationErrors.username 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="请输入用户名（至少3个字符）"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              {validationErrors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {validationErrors.username}
                </motion.p>
              )}
            </motion.div>

            {/* 密码输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 ${
                    validationErrors.password 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="请输入密码（至少6个字符）"
                  required
                  minLength={6}
                />
              </div>
              {validationErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {validationErrors.password}
                </motion.p>
              )}
            </motion.div>

            {/* 邮箱输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 ${
                    validationErrors.email 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              {validationErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {validationErrors.email}
                </motion.p>
              )}
            </motion.div>









            {/* 错误信息 */}
            <AnimatePresence>
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {state.error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>



            {/* 登录按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={state.loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  '登录'
                )}
              </motion.button>
            </motion.div>
          </form>


        </div>
      </motion.div>
    </div>
  );
}