import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Centralized QueryClient instance factory
// Provides default options for retries, stale times, cache times etc.

export function createAppQueryClient() {
  const enableLog = import.meta.env.DEV || import.meta.env.VITE_QUERY_DEBUG === 'true';

  const queryCache = new QueryCache({
    onError: (error, query) => {
      if (enableLog) {
        console.groupCollapsed('%c[Query Error]', 'color:#f00', query.queryKey);
        console.error(error);
        console.groupEnd();
      }
    },
    onSuccess: (_data, query) => {
      if (enableLog) {
        console.groupCollapsed('%c[Query Success]', 'color:#0a0', query.queryKey);
        console.groupEnd();
      }
    },
  });

  const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (enableLog) {
        console.groupCollapsed('%c[Mutation Error]', 'color:#f80', mutation.options.mutationKey);
        console.error(error);
        console.groupEnd();
      }
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      if (enableLog) {
        console.groupCollapsed('%c[Mutation Success]', 'color:#09f', mutation.options.mutationKey);
        console.groupEnd();
      }
    },
    onSettled: (_data, _error, _variables, mutation) => {
      if (enableLog) {
        // Could add timing metrics later
      }
    }
  });

  const client = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // 不重试用户拒签、明确的 4xx 逻辑错误
          const message = error?.message || '';
          if (/User rejected|denied|revert/i.test(message)) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,      // 默认 30s
        gcTime: 5 * 60 * 1000,  // 缓存 5min
      },
      mutations: {
        retry: 0,
      }
    }
  });

  // Resource-level staleTime policies
  const stalePolicies: Record<string, number> = {
    events: 60_000,       // 活动列表 1m
    event: 120_000,       // 单个活动 2m
    tickets: 20_000,      // 用户门票 20s
    orders: 10_000,       // 市场订单 10s
    swapQuote: 3_000,     // 兑换报价 3s (高频刷新)
    liquidity: 15_000,    // 流动性信息 15s
  };

  Object.entries(stalePolicies).forEach(([key, staleTime]) => {
    client.setQueryDefaults([key], {
      staleTime,
      gcTime: staleTime * 10, // 保留更久以提升命中率
    });
  });

  // 组合键的动态策略示例（例如 ['event', id]）：
  // React Query 会匹配精确 key；我们可在调用处只传 ['event', id] 即继承上面 defaults。

  return client;
}

export const queryClient = createAppQueryClient();
