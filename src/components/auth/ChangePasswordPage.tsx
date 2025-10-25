'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Shield, Check, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordRequest } from '@/types/auth';
import { validatePasswordStrength, PasswordStrength } from '@/lib/password-validation';

interface ChangePasswordPageProps {
  onPasswordChanged: () => void;
}

export default function ChangePasswordPage({ onPasswordChanged }: ChangePasswordPageProps) {
  const { changePassword, state, clearError } = useAuth();
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setConfirmPasswordError('');

    // 验证密码确认
    if (formData.newPassword !== formData.confirmPassword) {
      setConfirmPasswordError('两次输入的密码不一致');
      return;
    }

    // 验证密码强度
    if (!passwordStrength.isValid) {
      return;
    }

    const result = await changePassword(formData);
    if (result.success) {
      onPasswordChanged();
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, newPassword: value }));
    setPasswordStrength(validatePasswordStrength(value));
    
    // 清除确认密码错误
    if (confirmPasswordError && formData.confirmPassword) {
      if (value === formData.confirmPassword) {
        setConfirmPasswordError('');
      }
    }
    
    if (state.error) clearError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    
    // 实时验证密码确认
    if (value && formData.newPassword !== value) {
      setConfirmPasswordError('两次输入的密码不一致');
    } else {
      setConfirmPasswordError('');
    }
    
    if (state.error) clearError();
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
        return '非常弱';
      case 1:
        return '弱';
      case 2:
        return '一般';
      case 3:
        return '强';
      case 4:
        return '非常强';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-red-900 dark:to-pink-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute top-20 right-10 text-orange-200 dark:text-orange-800 opacity-20"
        >
          <Shield size={50} />
        </motion.div>
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.15, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute bottom-32 left-16 text-red-200 dark:text-red-800 opacity-20"
        >
          <Lock size={60} />
        </motion.div>
      </div>

      {/* 修改密码卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-lg"
      >
        {/* 卡片背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
        
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
          {/* 标题区域 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              修改默认密码
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              为了账户安全，请立即修改默认密码
            </p>
          </motion.div>

          {/* 安全提示 */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  安全要求
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  <li>• 密码长度至少8位</li>
                  <li>• 包含大小写字母、数字和特殊字符</li>
                  <li>• 不能与用户名相同</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* 修改密码表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 当前密码 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                当前密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  placeholder="请输入当前密码"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* 新密码 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                新密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  placeholder="请输入新密码"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
              
              {/* 密码强度指示器 */}
              {formData.newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">密码强度</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.score >= 3 ? 'text-green-600 dark:text-green-400' : 
                      passwordStrength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {getStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="flex space-x-1 mb-2">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <motion.div
                        key={level}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: level < passwordStrength.score ? 1 : 0.3 }}
                        transition={{ delay: level * 0.1, duration: 0.3 }}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          level < passwordStrength.score ? getStrengthColor(passwordStrength.score) : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-2"
                        >
                          <X className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-600 dark:text-red-400">{feedback}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* 确认密码 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                确认新密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 ${
                    confirmPasswordError 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-orange-500'
                  }`}
                  placeholder="请再次输入新密码"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
              
              {/* 密码匹配指示 */}
              {formData.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center space-x-2"
                >
                  {confirmPasswordError ? (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</span>
                    </>
                  ) : formData.newPassword === formData.confirmPassword ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">密码匹配</span>
                    </>
                  ) : null}
                </motion.div>
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

            {/* 提交按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={state.loading || !passwordStrength.isValid || !!confirmPasswordError}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state.loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  '修改密码'
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* 页脚信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              密码修改后将自动跳转到系统首页
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}