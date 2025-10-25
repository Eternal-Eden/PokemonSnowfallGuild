// 自动导入论坛相关模块
import WelcomePanel from './WelcomePanel';
import MessageSummary from './MessageSummary';

// 注册模块到模块系统
const modules = {
  WelcomePanel,
  MessageSummary,
};

// 导出模块加载器
export const loadModule = (name: string) => modules[name as keyof typeof modules];
export default modules;

// 添加新模块时，请在此处导入并添加到 modules 对象中