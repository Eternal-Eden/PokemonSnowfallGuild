import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AuthUser } from './auth';

// 扩展Request接口以包含用户信息
interface UploadAuthenticatedRequest extends Request {
  user?: AuthUser;
}

// 支持的文件类型
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const ALLOWED_FILE_TYPES = {
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

// 文件大小限制
const FILE_SIZE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  image: 10 * 1024 * 1024, // 10MB
  file: 20 * 1024 * 1024, // 20MB
};

// 确保上传目录存在
function ensureUploadDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 生成唯一文件名
function generateFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${userId || 'anonymous'}_${timestamp}_${random}_${baseName}${ext}`;
}

// 创建Multer存储配置
function createStorage(uploadType: 'avatar' | 'image' | 'file') {
  return multer.memoryStorage(); // 使用内存存储，便于后续处理
}

// 文件过滤器
function createFileFilter(uploadType: 'avatar' | 'image' | 'file') {
  return (req: UploadAuthenticatedRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    let allowedTypes: Record<string, string>;
    
    switch (uploadType) {
      case 'avatar':
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'file':
        allowedTypes = ALLOWED_FILE_TYPES;
        break;
      default:
        return cb(new Error('无效的上传类型'));
    }
    
    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  };
}

// 创建Multer实例
function createMulterInstance(uploadType: 'avatar' | 'image' | 'file') {
  return multer({
    storage: createStorage(uploadType),
    fileFilter: createFileFilter(uploadType),
    limits: {
      fileSize: FILE_SIZE_LIMITS[uploadType],
      files: uploadType === 'avatar' ? 1 : 10, // 头像只能上传1个，其他最多10个
    },
  });
}

// 保存文件到磁盘
export async function saveFileToDisk(
  file: Express.Multer.File,
  uploadType: 'avatar' | 'image' | 'file',
  userId?: string
): Promise<{ filename: string; path: string; url: string }> {
  const uploadDir = path.join(process.cwd(), 'uploads', uploadType);
  ensureUploadDir(uploadDir);
  
  const filename = generateFileName(file.originalname, userId);
  const filePath = path.join(uploadDir, filename);
  const fileUrl = `/uploads/${uploadType}/${filename}`;
  
  // 写入文件
  await fs.promises.writeFile(filePath, file.buffer);
  
  return {
    filename,
    path: filePath,
    url: fileUrl,
  };
}

// 删除文件
export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Delete file error:', error);
  }
}

// 验证图片文件
export function validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES]) {
    return { valid: false, error: '不支持的图片格式' };
  }
  
  if (file.size > FILE_SIZE_LIMITS.image) {
    return { valid: false, error: '图片文件过大' };
  }
  
  return { valid: true };
}

// 验证头像文件
export function validateAvatarFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES]) {
    return { valid: false, error: '头像必须是图片格式' };
  }
  
  if (file.size > FILE_SIZE_LIMITS.avatar) {
    return { valid: false, error: '头像文件过大' };
  }
  
  return { valid: true };
}

// 验证普通文件
export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    return { valid: false, error: '不支持的文件格式' };
  }
  
  if (file.size > FILE_SIZE_LIMITS.file) {
    return { valid: false, error: '文件过大' };
  }
  
  return { valid: true };
}

// 获取文件信息
export function getFileInfo(file: Express.Multer.File) {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    extension: path.extname(file.originalname),
  };
}

// 导出Multer中间件
export const uploadAvatar = createMulterInstance('avatar').single('avatar');
export const uploadImage = createMulterInstance('image').single('image');
export const uploadImages = createMulterInstance('image').array('images', 10);
export const uploadFile = createMulterInstance('file').single('file');
export const uploadFiles = createMulterInstance('file').array('files', 10);

// 混合上传中间件（支持多种文件类型）
export const uploadMixed = createMulterInstance('file').fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'files', maxCount: 10 },
]);

// 错误处理中间件
export function handleUploadError(error: any, req: Request, res: any, next: any) {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: '文件大小超出限制',
          error: error.message,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: '文件数量超出限制',
          error: error.message,
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: '意外的文件字段',
          error: error.message,
        });
      default:
        return res.status(400).json({
          success: false,
          message: '文件上传错误',
          error: error.message,
        });
    }
  }
  
  if (error.message.includes('不支持的文件类型') || error.message.includes('无效的上传类型')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next(error);
}