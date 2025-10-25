// 模块类型定义
export interface ModuleConfig {
  id: string;
  name: string;
  component: React.ComponentType<Record<string, unknown>>;
  position: 'main' | 'sidebar';
  order: number;
  props?: Record<string, unknown>;
}



// 一言API响应类型
export interface HitokotoResponse {
  hitokoto: string;
  from: string;
  id: number;
  uuid: string;
  commit_from: string;
  creator: string;
  creator_uid: number;
  reviewer: number;
  type: string;
  length: number;
}