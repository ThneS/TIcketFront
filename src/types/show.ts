// Show types definition for /show API endpoint
export interface Show {
  id: string;          // 唯一标识
  name: string;        // 名称
  description?: string;// 描述
  createdAt?: string;  // 创建时间 ISO 字符串
  updatedAt?: string;  // 更新时间
  [key: string]: unknown;  // 兼容后端暂未定义字段
}

export interface ShowListParams {
  page?: number;       // 页码（从 1 开始）
  pageSize?: number;   // 每页数量
}

export interface PaginatedShows {
  items: Show[];
  total?: number;      // 总条数（如果后端返回）
  page?: number;
  pageSize?: number;
}