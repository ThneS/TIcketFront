import type { Show, ShowListParams, PaginatedShows } from "../types/show";
import { http } from "./request";

// Helper: convert pagination input into backend expected {limit, offset}
function normalizePagination(params: ShowListParams = {}): {
  limit?: number;
  offset?: number;
} {
  const { page, pageSize, limit, offset } = params as any;
  if (typeof limit === "number" || typeof offset === "number") {
    return { limit, offset };
  }
  if (page !== undefined && pageSize !== undefined) {
    const p = Math.max(1, page);
    return { limit: pageSize, offset: (p - 1) * pageSize };
  }
  if (pageSize !== undefined) {
    return { limit: pageSize, offset: 0 };
  }
  return {};
}

/**
 * 获取 Show 列表（后端当前返回 ApiResponse.data 为数组）
 * 如果未来后端改为分页结构 { items, total }，可以在此处检测并向后兼容。
 */
export async function fetchShows(
  params: ShowListParams = {}
): Promise<Show[] | PaginatedShows> {
  const { limit, offset } = normalizePagination(params);
  const data = await http.get<unknown>("/shows", { query: { limit, offset } });

  if (Array.isArray(data)) {
    return data as Show[];
  }
  // 兼容潜在的 { items, total } 格式
  if (data && typeof data === "object" && "items" in data) {
    return data as PaginatedShows;
  }
  // 不符合预期结构时返回空数组，或者抛出错误也可
  return [];
}

/**
 * 获取单个 Show
 */
export async function fetchShow(id: string): Promise<Show> {
  return http.get<Show>(`/show/${id}`);
}
