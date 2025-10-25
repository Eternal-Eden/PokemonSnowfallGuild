import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthUser } from '@/lib/auth';
import {
  saveFileToDisk,
  validateAvatarFile,
  validateImageFile,
  validateFile,
  getFileInfo,
  deleteFile,
} from '@/lib/upload';
import { Readable } from 'stream';
import fs from 'fs';

const prisma = new PrismaClient();

// Define types for upload responses
interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  extension: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface UploadError {
  filename: string;
  error: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    files: UploadedFile[];
    uploadType: string;
    totalFiles: number;
    successCount: number;
    errorCount: number;
  };
  errors?: UploadError[];
}

type UploadType = 'avatar' | 'image' | 'file';

// Remove unused function
// function convertNextRequestToNodeRequest(request: NextRequest) {
//   const headers: Record<string, string> = {};
//   request.headers.forEach((value, key) => {
//     headers[key] = value;
//   });

//   return {
//     headers,
//     method: request.method,
//     url: request.url,
//   };
// }

// 处理multipart/form-data
async function parseMultipartData(request: NextRequest): Promise<{
  fields: Record<string, string>;
  files: Express.Multer.File[];
}> {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  const files: Express.Multer.File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      files.push({
        fieldname: key,
        originalname: value.name,
        encoding: '7bit',
        mimetype: value.type,
        size: value.size,
        buffer,
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from(buffer),
      });
    } else {
      fields[key] = value.toString();
    }
  }

  return { fields, files };
}

// 通用文件上传处理
export const POST = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const { fields, files } = await parseMultipartData(request);
    const uploadType = fields.type || 'file'; // avatar, image, file
    
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有上传文件' },
        { status: 400 }
      );
    }

    const uploadedFiles: UploadedFile[] = [];
    const errors: UploadError[] = [];

    for (const file of files) {
      try {
        // 验证文件
        let validation;
        switch (uploadType) {
          case 'avatar':
            validation = validateAvatarFile(file);
            break;
          case 'image':
            validation = validateImageFile(file);
            break;
          case 'file':
          default:
            validation = validateFile(file);
            break;
        }

        if (!validation.valid) {
          errors.push({
            filename: file.originalname,
            error: validation.error,
          });
          continue;
        }

        // 保存文件
        const savedFile = await saveFileToDisk(file, uploadType as UploadType, user.id);
        const fileInfo = getFileInfo(file);

        // 如果是头像上传，更新用户头像
        if (uploadType === 'avatar') {
          // 删除旧头像
          const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatarUrl: true },
          });

          if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/')) {
            const oldAvatarPath = currentUser.avatarUrl.replace('/uploads/', 'uploads/');
            await deleteFile(oldAvatarPath);
          }

          // 更新用户头像URL
          await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: savedFile.url },
          });
        }

        uploadedFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: savedFile.filename,
          originalName: fileInfo.originalName,
          url: savedFile.url,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          extension: fileInfo.extension,
          uploadedBy: user.id,
          uploadedAt: new Date(),
        });
      } catch (fileError) {
        console.error('File upload error:', fileError);
        errors.push({
          filename: file.originalname,
          error: '文件上传失败',
        });
      }
    }

    const response: UploadResponse = {
      success: uploadedFiles.length > 0,
      message: uploadedFiles.length > 0 ? '文件上传成功' : '所有文件上传失败',
      data: {
        files: uploadedFiles,
        uploadType,
        totalFiles: files.length,
        successCount: uploadedFiles.length,
        errorCount: errors.length,
      },
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      { success: false, message: '文件上传失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// 获取文件信息
export const GET = withAuth(async (request: NextRequest, _user: AuthUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const type = searchParams.get('type') || 'file';

    if (!filename) {
      return NextResponse.json(
        { success: false, message: '缺少文件名参数' },
        { status: 400 }
      );
    }

    // 这里可以添加文件访问权限检查
    // 例如检查文件是否属于当前用户或是否为公开文件

    const fileUrl = `/uploads/${type}/${filename}`;
    const filePath = `uploads/${type}/${filename}`;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(filePath);

    return NextResponse.json({
      success: true,
      data: {
        filename,
        url: fileUrl,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
    });
  } catch (error) {
    console.error('Get file info error:', error);

    return NextResponse.json(
      { success: false, message: '获取文件信息失败' },
      { status: 500 }
    );
  }
});

// 删除文件
export const DELETE = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const type = searchParams.get('type') || 'file';

    if (!filename) {
      return NextResponse.json(
        { success: false, message: '缺少文件名参数' },
        { status: 400 }
      );
    }

    // 检查文件权限（只能删除自己上传的文件，除非是版主）
    const isModerator = user.role === 'MODERATOR';
    const isOwner = filename.includes(user.id);

    if (!isModerator && !isOwner) {
      return NextResponse.json(
        { success: false, message: '无权删除此文件' },
        { status: 403 }
      );
    }

    const filePath = `uploads/${type}/${filename}`;
    
    // 如果是头像文件，需要更新用户记录
    if (type === 'avatar') {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null },
      });
    }

    // 删除文件
    await deleteFile(filePath);

    return NextResponse.json({
      success: true,
      message: '文件删除成功',
    });
  } catch (error) {
    console.error('Delete file error:', error);

    return NextResponse.json(
      { success: false, message: '文件删除失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});