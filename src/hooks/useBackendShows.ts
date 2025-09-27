import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { fetchShow, fetchShows } from "../api/show";
import type { Show, ShowListParams, PaginatedShows } from "../types/show";
import { isApiEnabled } from "../api/request";
import { useToast } from "../components/feedback/ToastProvider";
import { isApiErrorToastEnabled } from "../config/app";

/**
 * 后端 API: 获取单个 Show
 * 与链上合约独立；如果后端关闭 (VITE_API_BASE_URL 未配置) 则自动禁用。
 */
export function useBackendShow(id: string | undefined) {
  const enabled = isApiEnabled() && !!id;
  const { push } = useToast();
  const lastErrRef = useRef<string | undefined>(undefined);
  // 如果用户选择 backend 但未配置 base，给一次性提示
  useEffect(() => {
    if (!isApiEnabled() && id) {
      if (lastErrRef.current === "__no_base__") return;
      lastErrRef.current = "__no_base__";
      push({
        type: "warning",
        title: "后端地址未配置",
        description: "缺少 VITE_API_BASE_URL，已禁用 backend 详情请求",
        duration: 5000,
      });
    }
  }, [id, push]);
  const query = useQuery({
    queryKey: ["backend", "show", id],
    enabled,
    queryFn: () => fetchShow(id!),
    staleTime: 30_000,
  });

  // 错误 -> Toast（去重）
  useEffect(() => {
    if (!enabled || !isApiErrorToastEnabled()) return;
    if (query.isError && query.error) {
      const err = query.error as any;
      const msg: string = err?.message || err?.messageText || "请求失败";
      if (lastErrRef.current === msg) return;
      lastErrRef.current = msg;
      const rid = err?.requestId ? ` (rid: ${err.requestId})` : "";
      push({
        type: "error",
        title: "加载演出详情失败",
        description: msg + rid,
        duration: 5000,
      });
    }
  }, [enabled, query.isError, query.error, push]);
  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  } as const;
}

/**
 * 后端 API: 获取 Show 列表 / 可分页
 * 如果后端未来返回 { items,total } 会在 fetchShows 中自动兼容。
 */
export function useBackendShows(params: ShowListParams = {}) {
  const enabled = isApiEnabled();
  const { push } = useToast();
  const lastErrRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isApiEnabled()) {
      if (lastErrRef.current === "__no_base_list__") return;
      lastErrRef.current = "__no_base_list__";
      push({
        type: "warning",
        title: "后端地址未配置",
        description: "缺少 VITE_API_BASE_URL，列表后端数据源已禁用",
        duration: 5000,
      });
    }
  }, [push]);
  const query = useQuery({
    queryKey: ["backend", "shows", params],
    enabled,
    queryFn: () => fetchShows(params),
    // 使用 placeholderData 维持翻页前数据，平滑过渡（React Query v5 替代 keepPreviousData）
    placeholderData: (prev) => prev as any,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!enabled || !isApiErrorToastEnabled()) return;
    if (query.isError && query.error) {
      const err = query.error as any;
      const msg: string = err?.message || err?.messageText || "请求失败";
      if (lastErrRef.current === msg) return;
      lastErrRef.current = msg;
      const rid = err?.requestId ? ` (rid: ${err.requestId})` : "";
      push({
        type: "error",
        title: "加载演出列表失败",
        description: msg + rid,
        duration: 5000,
      });
    }
  }, [enabled, query.isError, query.error, push]);

  const raw = query.data;
  let items: Show[] = [];
  let pagination: PaginatedShows | undefined = undefined;
  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === "object" && "items" in raw) {
    const p = raw as PaginatedShows;
    items = p.items;
    pagination = p;
  }

  return {
    data: items,
    pagination,
    // 若占位数据存在且正在获取下一页，可暴露一个区分状态
    loading: query.isLoading,
    fetching: query.isFetching, // 组件可用 fetching && !loading 来做轻量骨架
    error: query.error,
    refetch: query.refetch,
  } as const;
}
