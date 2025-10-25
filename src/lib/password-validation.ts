/**
 * 客户端密码强度验证
 * 不依赖Node.js模块，可在浏览器中使用
 */

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // 基本长度检查
  if (password.length < 8) {
    feedback.push('密码长度至少需要8个字符');
  } else {
    score += 1;
  }

  // 包含小写字母
  if (!/[a-z]/.test(password)) {
    feedback.push('密码需要包含小写字母');
  } else {
    score += 1;
  }

  // 包含大写字母
  if (!/[A-Z]/.test(password)) {
    feedback.push('密码需要包含大写字母');
  } else {
    score += 1;
  }

  // 包含数字
  if (!/\d/.test(password)) {
    feedback.push('密码需要包含数字');
  } else {
    score += 1;
  }

  // 包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('密码需要包含特殊字符');
  } else {
    score += 1;
  }

  // 长度加分
  if (password.length >= 12) {
    score += 1;
  }

  // 复杂度加分
  if (password.length >= 16 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // 限制最高分数
  score = Math.min(score, 4);

  // 常见密码检查
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', '123123', 'qwerty123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('请避免使用常见密码');
    score = Math.max(0, score - 2);
  }

  // 重复字符检查
  if (/(..).*\1/.test(password)) {
    feedback.push('避免使用重复的字符组合');
    score = Math.max(0, score - 1);
  }

  // 连续字符检查
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('避免使用连续的字符');
    score = Math.max(0, score - 1);
  }

  const isValid = score >= 3 && feedback.length === 0;

  return {
    score,
    feedback,
    isValid
  };
}

/**
 * 生成密码强度建议
 */
export function getPasswordSuggestions(): string[] {
  return [
    '使用至少8个字符的密码',
    '包含大小写字母、数字和特殊字符',
    '避免使用个人信息（如姓名、生日）',
    '不要使用常见密码或字典单词',
    '避免重复字符或连续字符',
    '考虑使用密码管理器生成强密码'
  ];
}

/**
 * 检查密码是否包含个人信息
 */
export function containsPersonalInfo(password: string, userInfo: {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}): boolean {
  const lowerPassword = password.toLowerCase();
  
  const checkFields = [
    userInfo.username,
    userInfo.email?.split('@')[0],
    userInfo.firstName,
    userInfo.lastName
  ].filter(Boolean);

  return checkFields.some(field => 
    field && field.length > 2 && lowerPassword.includes(field.toLowerCase())
  );
}

/**
 * 密码强度颜色映射
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
}

/**
 * 密码强度文本
 */
export function getPasswordStrengthText(score: number): string {
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
}

/**
 * 密码强度进度条宽度
 */
export function getPasswordStrengthWidth(score: number): string {
  switch (score) {
    case 0:
      return 'w-0';
    case 1:
      return 'w-1/4';
    case 2:
      return 'w-2/4';
    case 3:
      return 'w-3/4';
    case 4:
      return 'w-full';
    default:
      return 'w-0';
  }
}

export default {
  validatePasswordStrength,
  getPasswordSuggestions,
  containsPersonalInfo,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  getPasswordStrengthWidth
};