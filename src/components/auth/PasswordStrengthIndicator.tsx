'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { PasswordStrength } from '@/types/auth';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  password: string;
}

export default function PasswordStrengthIndicator({ strength, password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return '弱';
    if (score <= 2) return '一般';
    if (score <= 3) return '较强';
    return '强';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      {/* 强度条 */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">密码强度:</span>
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full rounded-full ${getStrengthColor(strength.score)}`}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.score <= 1 ? 'text-red-600' :
          strength.score <= 2 ? 'text-orange-600' :
          strength.score <= 3 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {getStrengthText(strength.score)}
        </span>
      </div>

      {/* 要求列表 */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 text-xs"
            >
              <X className="w-3 h-3 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{feedback}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 满足要求的提示 */}
      {strength.isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 text-xs"
        >
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">密码强度符合要求</span>
        </motion.div>
      )}
    </motion.div>
  );
}