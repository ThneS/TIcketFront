import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Show, ShowListParams, PaginatedShows } from "../types/show";
import { fetchShows, fetchShow } from "../api/show";
import { isApiEnabled } from "../api/request";

/**
 * Hook to fetch a list of shows
 * @param params - Pagination parameters
 * @returns { data, loading, error, reload }
 */
export function useShows(params: ShowListParams = {}) {
  const enabled = isApiEnabled();

  const query = useQuery({
    queryKey: ["shows", params],
    enabled,
    queryFn: () => fetchShows(params),
    staleTime: 30_000, // 30 seconds
    retry: (failureCount, error: unknown) => {
      // Don't retry on 4xx errors
      const status = (error as { status?: number })?.status;
      if (typeof status === "number" && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Normalize the data to always return Shows array and pagination info
  const normalizeData = (data: Show[] | PaginatedShows | undefined) => {
    if (!data) return { items: [], pagination: undefined };

    if (Array.isArray(data)) {
      return { items: data, pagination: undefined };
    }

    return {
      items: data.items || [],
      pagination: {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      },
    };
  };

  const normalized = normalizeData(query.data);

  return {
    data: normalized.items,
    pagination: normalized.pagination,
    loading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  } as const;
}

/**
 * Hook to fetch a single show by ID
 * @param id - Show ID
 * @returns { data, loading, error, reload }
 */
export function useShow(id: string | undefined) {
  const enabled = isApiEnabled() && Boolean(id);

  const query = useQuery({
    queryKey: ["show", id],
    enabled,
    queryFn: () => fetchShow(id!),
    staleTime: 30_000, // 30 seconds
    retry: (failureCount, error: unknown) => {
      // Don't retry on 4xx errors
      const status = (error as { status?: number })?.status;
      if (typeof status === "number" && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  } as const;
}

/**
 * Hook for paginated shows with built-in pagination logic
 * @param initialParams - Initial pagination parameters
 * @returns Extended hook with pagination controls
 */
export function usePaginatedShows(
  initialParams: ShowListParams = { page: 1, pageSize: 12 }
) {
  const [params, setParams] = React.useState(initialParams);
  const result = useShows(params);

  const goToPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const changePageSize = (pageSize: number) => {
    setParams((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const refresh = () => {
    result.reload();
  };

  return {
    ...result,
    params,
    goToPage,
    changePageSize,
    refresh,
  } as const;
}
