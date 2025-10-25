import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check } from 'lucide-react';

interface AvatarUploadProps {
  onAvatarChange: (file: File | null) => void;
  currentAvatar?: string | null;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onAvatarChange,
  currentAvatar,
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      return '图片大小不能超过5MB';
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '请选择图片文件';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onAvatarChange(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    setError(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* 头像预览区域 */}
        <motion.div
          className={`relative w-24 h-24 rounded-full border-4 overflow-hidden cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="头像预览"
                className="w-full h-full object-cover"
              />
              {/* 悬停时显示的编辑图标 */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {/* 删除按钮 */}
              <motion.button
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-3 h-3" />
              </motion.button>
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">
                {isDragging ? '释放上传' : '点击上传'}
              </span>
            </div>
          )}
        </motion.div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </motion.div>

      {/* 提示文本 */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        支持 JPG、PNG 格式，大小不超过 5MB
      </p>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarUpload;