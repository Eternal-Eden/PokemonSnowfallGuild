/**
 * 请求验证工具模块
 */
import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import { ValidationError } from '../middleware/errorHandler';

// 扩展Request接口以包含multer的file属性
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
  [key: string]: any;
}

/**
 * 验证中间件生成器
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new ValidationError(errorMessage));
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * 验证查询参数
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new ValidationError(errorMessage));
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * 验证路径参数
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new ValidationError(errorMessage));
      return;
    }

    req.params = value;
    next();
  };
};

// 常用验证规则
export const commonValidations = {
  // UUID验证
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  
  // 用户名验证
  username: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9_-]+$'))
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.pattern.base': 'Username must only contain alphanumeric characters, underscores, and hyphens',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters'
    }),
  
  // 密码验证
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#+\\-_=])[A-Za-z\\d@$!%*?&#+\\-_=]+$'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  // 邮箱验证
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters'
    }),
  
  // 游戏昵称验证
  gameNickname: Joi.string()
    .min(2)
    .max(50)
    .pattern(new RegExp('^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$'))
    .required()
    .messages({
      'string.min': 'Game nickname must be at least 2 characters long',
      'string.max': 'Game nickname must not exceed 50 characters',
      'string.pattern.base': 'Game nickname can only contain Chinese characters, letters, numbers, underscores, hyphens, and spaces'
    }),
  

  
  // 分页验证
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // 排序验证
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'title').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  
  // 搜索验证
  search: Joi.string().max(100).allow(''),
  
  // 角色验证
  role: Joi.string().valid('moderator', 'user', 'member'),
  
  // 状态验证
  status: Joi.string().valid('active', 'inactive', 'pending', 'rejected', 'deleted'),
  
  // 内容验证
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).max(10000).required(),
  description: Joi.string().max(1000).allow(''),
  
  // 标签验证
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  
  // URL验证
  url: Joi.string().uri().max(500),
  
  // 日期验证
  date: Joi.date().iso(),
  dateRange: {
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }
};

// 认证相关验证模式
export const authSchemas = {
  // 登录即注册验证
  loginOrRegister: Joi.object({
    username: commonValidations.username,
    password: commonValidations.password,
    email: commonValidations.email.required(),
    twoFactorCode: Joi.string().length(6).pattern(/^\d{6}$/).optional()
  }),
  

  
  // 修改密码验证
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonValidations.password
  }),
  
  // 重置密码验证
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: commonValidations.password
  }),
  
  // 发送验证码验证（用于密码重置）
  sendVerificationCode: Joi.object({
    email: commonValidations.email.required()
  })
};

// 用户相关验证模式
export const userSchemas = {
  // 更新用户资料
  updateProfile: Joi.object({
    gameNickname: commonValidations.gameNickname.optional(),
    bio: Joi.string().max(500).allow(''),
    location: Joi.string().max(100).allow(''),
    website: commonValidations.url.optional(),
    birthday: Joi.date().max('now').optional()
  }),
  
  // 用户查询参数
  getUsersQuery: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: commonValidations.search,
    role: commonValidations.role.optional(),
    status: commonValidations.status.optional(),
    sortBy: Joi.string().valid('createdAt', 'username', 'role').default('createdAt'),
    sortOrder: commonValidations.sortOrder
  })
};

// 论坛相关验证模式
export const forumSchemas = {
  // 创建帖子
  createPost: Joi.object({
    title: commonValidations.title,
    content: commonValidations.content,
    type: Joi.string().valid('discussion', 'pokemon_rental', 'event').required(),
    categoryId: commonValidations.uuid.optional(),
    tags: commonValidations.tags.optional(),
    rentalInfo: Joi.object().optional()
  }),
  
  // 帖子查询参数
  getPostsQuery: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: commonValidations.search,
    type: Joi.string().valid('discussion', 'pokemon_rental', 'event').optional(),
    categoryId: commonValidations.uuid.optional(),
    authorId: commonValidations.uuid.optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'viewCount', 'likeCount').default('createdAt'),
    sortOrder: commonValidations.sortOrder
  })
};

/**
 * 自定义验证函数
 */
export const customValidators = {
  // 验证文件类型
  validateFileType: (allowedTypes: string[]) => {
    return (req: any, res: any, next: NextFunction): void => {
      if (!req.file) {
        next();
        return;
      }

      if (!allowedTypes.includes(req.file.mimetype)) {
        next(new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
        return;
      }

      next();
    };
  },
  
  // 验证文件大小
  validateFileSize: (maxSize: number) => {
    return (req: any, res: any, next: NextFunction): void => {
      if (!req.file) {
        next();
        return;
      }

      if (req.file.size > maxSize) {
        next(new ValidationError(`File size too large. Maximum size: ${maxSize} bytes`));
        return;
      }

      next();
    };
  }
};