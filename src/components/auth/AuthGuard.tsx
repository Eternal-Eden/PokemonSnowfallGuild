'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from './LoginPage';
import ChangePasswordPage from './ChangePasswordPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthStep = 'loading' | 'login' | 'change-password' | 'authenticated';

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAuth();
  const [authStep, setAuthStep] = useState<AuthStep>('loading');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // 检查认证状态
    if (state.loading) {
      setAuthStep('loading');
    } else if (!state.user) {
      setAuthStep('login');
    } else if (state.user.requirePasswordChange) {
      setAuthStep('change-password');
    } else {
      setAuthStep('authenticated');
    }
  }, [state.loading, state.user]);

  const handleLoginSuccess = (requirePasswordChange: boolean) => {
    if (requirePasswordChange) {
      setAuthStep('change-password');
    } else {
      setAuthStep('authenticated');
    }
  };

  const handlePasswordChanged = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setAuthStep('authenticated');
    }, 2000);
  };

  // 加载状态
  if (authStep === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="inline-block mb-4"
          >
            <Snowflake className="w-12 h-12 text-blue-500" />
          </motion.div>
          <motion.h2
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-xl font-semibold text-gray-700 dark:text-gray-300"
          >
            落雪公会管理系统
          </motion.h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">正在加载...</p>
        </motion.div>
      </div>
    );
  }

  // 成功提示
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900 dark:to-emerald-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            密码修改成功！
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-gray-600 dark:text-gray-400"
          >
            正在跳转到系统首页...
          </motion.p>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 0.8, ease: 'easeInOut' }}
            className="mt-6 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {authStep === 'login' && (
        <motion.div
          key="login"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        </motion.div>
      )}
      
      {authStep === 'change-password' && (
        <motion.div
          key="change-password"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <ChangePasswordPage onPasswordChanged={handlePasswordChanged} />
        </motion.div>
      )}
      
      {authStep === 'authenticated' && (
        <motion.div
          key="authenticated"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}