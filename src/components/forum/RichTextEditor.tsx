'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Quote,
  Code,
  Smile,
  Eye,
  Edit3
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  showPreview?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
  showPreview = true
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 常用表情符号
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !event.target) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // 设置编辑器内容
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      // 确保内容正确获取，避免乱序
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // 如果内容为空，确保编辑器可以接收输入
      if (!content || content === '<br>' || content === '&nbsp;') {
        editorRef.current.innerHTML = '';
      }
    }
  };

  // 处理粘贴事件，确保内容格式正确
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };
  
  // 处理键盘事件，确保在图片后可以正常输入
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果按下回车键且光标在图片后，确保可以换行
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        // 检查是否在图片元素后
        if (container.nodeType === Node.ELEMENT_NODE) {
          const element = container as Element;
          const prevSibling = element.previousElementSibling;
          if (prevSibling && prevSibling.tagName === 'IMG') {
            e.preventDefault();
            const br = document.createElement('br');
            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);
            selection.removeAllRanges();
            selection.addRange(range);
            handleInput();
          }
        }
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // 保存当前选区
        const selection = window.getSelection();
        let range: Range | null = null;
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        }
        
        // 插入图片
        if (editorRef.current) {
          // 如果有选区，使用选区位置插入
          if (range) {
            range.deleteContents();
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '0.5rem';
            img.style.margin = '0.5rem 0';
            range.insertNode(img);
            
            // 在图片后添加一个空的文本节点，确保可以继续输入
            const textNode = document.createTextNode('\u00A0'); // 不间断空格
            range.setStartAfter(img);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            
            selection?.removeAllRanges();
            selection?.addRange(range);
          } else {
            // 没有选区时，在末尾插入
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '0.5rem';
            img.style.margin = '0.5rem 0';
            editorRef.current.appendChild(img);
            
            // 在图片后添加换行和空格，确保可以继续输入
            const br = document.createElement('br');
            const textNode = document.createTextNode('\u00A0');
            editorRef.current.appendChild(br);
            editorRef.current.appendChild(textNode);
            
            // 设置光标到文本节点
            const newRange = document.createRange();
            newRange.setStartAfter(textNode);
            newRange.setEndAfter(textNode);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
          
          // 触发内容更新
          onChange(editorRef.current.innerHTML);
          
          // 确保编辑器获得焦点
          editorRef.current.focus();
        }
      };
      reader.readAsDataURL(file);
    }
    
    // 清空文件输入，允许重复选择同一文件
    event.target.value = '';
  };

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += emoji;
        // 设置光标到末尾
        const newRange = document.createRange();
        newRange.selectNodeContents(editorRef.current);
        newRange.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      }
      onChange(editorRef.current.innerHTML);
      // 确保编辑器保持焦点
      editorRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  const insertLink = () => {
    const url = prompt('请输入链接地址:');
    if (url) {
      const text = prompt('请输入链接文字:') || url;
      execCommand('insertHTML', `<a href="${url}" target="_blank">${text}</a>`);
    }
  };

  const previewRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isPreviewMode && previewRef.current) {
      previewRef.current.innerHTML = value || '<p class="text-gray-500">预览内容将在这里显示...</p>';
    }
  }, [value, isPreviewMode]);

  const renderPreview = () => {
    return (
      <div 
        ref={previewRef}
        className="prose prose-sm max-w-none dark:prose-invert p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
        style={{ minHeight, maxHeight }}
      />
    );
  };

  const toolbarButtons = [
    {
      icon: Bold,
      command: 'bold',
      title: '粗体',
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      command: 'italic',
      title: '斜体',
      shortcut: 'Ctrl+I'
    },
    {
      icon: Underline,
      command: 'underline',
      title: '下划线',
      shortcut: 'Ctrl+U'
    },
    {
      icon: List,
      command: 'insertUnorderedList',
      title: '无序列表'
    },
    {
      icon: ListOrdered,
      command: 'insertOrderedList',
      title: '有序列表'
    },
    {
      icon: Quote,
      command: 'formatBlock',
      value: 'blockquote',
      title: '引用'
    },
    {
      icon: Code,
      command: 'formatBlock',
      value: 'pre',
      title: '代码块'
    }
  ];

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center space-x-1">
          {/* 格式化按钮 */}
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => execCommand(button.command, button.value)}
                disabled={disabled}
                title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            );
          })}
          
          {/* 分隔线 */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          {/* 链接按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={insertLink}
            disabled={disabled}
            title="插入链接"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Link className="w-4 h-4" />
          </motion.button>
          
          {/* 图片按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="插入图片"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Image className="w-4 h-4" />
          </motion.button>
          
          {/* 表情按钮 */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              title="插入表情"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Smile className="w-4 h-4" />
            </motion.button>
            
            {/* 表情选择器 */}
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50"
              >
                <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* 预览切换 */}
        {showPreview && (
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                isPreviewMode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>预览</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
      
      {/* 编辑器内容 */}
      <div className="relative">
        {isPreviewMode ? (
          renderPreview()
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="p-4 focus:outline-none text-gray-900 dark:text-gray-100 overflow-y-auto"
            style={{ minHeight, maxHeight }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        )}
        
        {/* 占位符 */}
        {!value && !isPreviewMode && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* 字符计数 */}
      <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>支持 HTML 格式</span>
            <span>•</span>
            <span>Ctrl+B 粗体, Ctrl+I 斜体</span>
          </div>
          <div>
            字符数: {value.replace(/<[^>]*>/g, '').length}
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS 样式（需要添加到全局样式中）
const editorStyles = `
  [contenteditable]:empty:before {
    content: attr(data-placeholder);
    color: #9CA3AF;
    pointer-events: none;
  }
  
  [contenteditable] blockquote {
    border-left: 4px solid #E5E7EB;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #6B7280;
  }
  
  [contenteditable] pre {
    background-color: #F3F4F6;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: 'Courier New', monospace;
    overflow-x: auto;
  }
  
  [contenteditable] ul, [contenteditable] ol {
    padding-left: 2rem;
    margin: 1rem 0;
  }
  
  [contenteditable] a {
    color: #3B82F6;
    text-decoration: underline;
  }
  
  [contenteditable] img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 0.5rem 0;
  }
`;

// 导出样式以便在全局样式中使用
export { editorStyles };