import * as React from "react";
import { buildIpfsHttpUrl } from "../lib/ipfs.ts";

export interface UseIpfsJsonOptions {
  /** 是否禁用请求 */
  enabled?: boolean;
  /** 允许覆盖网关（不传则使用 buildIpfsHttpUrl 内部默认网关逻辑） */
  gatewayOverride?: string;
  /** 最大缓存年龄（毫秒），默认 5 分钟 */
  maxAgeMs?: number;
  /** 使用 localStorage（默认 sessionStorage 优先，若不可用则内存） */
  persistInLocalStorage?: boolean;
}

interface CacheEntry {
  data: any;
  ts: number; // 存入时间戳
}

// 全局内存缓存（页面刷新后失效）
const memoryCache = new Map<string, CacheEntry>();
// 进行中的请求，避免并发重复 fetch
const inflight = new Map<string, Promise<any>>();

function storageAvailable(type: "localStorage" | "sessionStorage") {
  try {
    const s = window[type];
    const k = "__ipfs_cache_test__";
    s.setItem(k, "1");
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function getPersistStore(useLocal: boolean) {
  if (typeof window === "undefined") return undefined;
  if (useLocal)
    return storageAvailable("localStorage") ? window.localStorage : undefined;
  return storageAvailable("sessionStorage") ? window.sessionStorage : undefined;
}

function normalizeKey(uri: string): string {
  if (!uri) return "";
  let v = uri.trim();
  if (v.startsWith("ipfs://")) v = v.replace(/^ipfs:\/\//, "");
  // 简单归一化，去掉多余的前导斜杠
  v = v.replace(/^\//, "");
  return v;
}

export function useIpfsJson(
  metadataURI: string | undefined,
  options: UseIpfsJsonOptions = {}
) {
  const {
    enabled = true,
    gatewayOverride,
    maxAgeMs = 5 * 60 * 1000,
    persistInLocalStorage = false,
  } = options;

  const key = React.useMemo(
    () => (metadataURI ? normalizeKey(metadataURI) : ""),
    [metadataURI]
  );
  const persistStore = React.useMemo(
    () => getPersistStore(persistInLocalStorage),
    [persistInLocalStorage]
  );

  const [data, setData] = React.useState<any | undefined>(() => {
    if (!key) return undefined;
    // 1. 尝试内存缓存
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.ts < maxAgeMs) return mem.data;
    // 2. 尝试持久缓存
    if (persistStore) {
      try {
        const raw = persistStore.getItem("IPFS_JSON::" + key);
        if (raw) {
          const parsed: CacheEntry = JSON.parse(raw);
          if (Date.now() - parsed.ts < maxAgeMs) {
            memoryCache.set(key, parsed); // 回填内存
            return parsed.data;
          }
        }
      } catch {
        /* ignore */
      }
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(
    !!(key && enabled && data === undefined)
  );
  const [error, setError] = React.useState<Error | undefined>(undefined);

  const abortRef = React.useRef<AbortController | null>(null);

  const fetchData = React.useCallback(async (): Promise<any | undefined> => {
    if (!key || !enabled) return undefined;
    // 缓存命中（再次调用 refetch 时不强制跳过）
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.ts < maxAgeMs) return mem.data;

    // 已有进行中的请求
    const existing = inflight.get(key);
    if (existing) return existing;

    const controller = new AbortController();
    abortRef.current = controller;

    const p = (async () => {
      try {
        // 构建 URL：如果传了覆盖网关且是 ipfs 链接则替换
        let url: string;
        if (/^https?:\/\//i.test(metadataURI || "")) {
          url = metadataURI as string;
        } else if (gatewayOverride) {
          const norm = normalizeKey(metadataURI || "");
          let gw = gatewayOverride.trim();
          if (!gw.endsWith("/")) gw += "/";
          if (!gw.includes("/ipfs/")) {
            if (!gw.endsWith("ipfs/")) gw += "ipfs/";
          }
          url = gw + norm;
        } else {
          url = buildIpfsHttpUrl(metadataURI || "");
        }
        if (!url) throw new Error("Empty metadata url");
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json().catch(() => null);
        const entry: CacheEntry = { data: json, ts: Date.now() };
        memoryCache.set(key, entry);
        if (persistStore) {
          try {
            persistStore.setItem("IPFS_JSON::" + key, JSON.stringify(entry));
          } catch {
            /* ignore persist quota errors */
          }
        }
        return json;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, p);
    return p;
  }, [key, enabled, maxAgeMs, metadataURI, gatewayOverride, persistStore]);

  // 初次与依赖变化时自动请求
  React.useEffect(() => {
    if (!key || !enabled) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setError(undefined);
    // 如果已有 data 则不触发 loading
    if (data !== undefined) return;
    setIsLoading(true);
    fetchData()
      .then((res) => {
        if (!mounted) return;
        setData(res);
      })
      .catch((e: any) => {
        if (!mounted) return;
        if (e?.name === "AbortError") return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [key, enabled, fetchData]);

  const refetch = React.useCallback(async () => {
    if (!key) return;
    setIsLoading(true);
    setError(undefined);
    try {
      // 强制失效内存缓存（持久缓存暂不清除以便 fallback）
      memoryCache.delete(key);
      const res = await fetchData();
      setData(res);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchData]);

  return { data, isLoading, error, refetch, key };
}

// 简单的全局清理函数（可用于调试）
export function clearIpfsJsonCache() {
  memoryCache.clear();
  if (typeof window !== "undefined") {
    try {
      const ss = window.sessionStorage;
      Object.keys(ss).forEach((k) => {
        if (k.startsWith("IPFS_JSON::")) ss.removeItem(k);
      });
    } catch {
      /* ignore */
    }
  }
}
