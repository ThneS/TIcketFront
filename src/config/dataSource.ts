// 数据源配置：控制哪些功能走链上(contract) / 后端(backend) / 混合(hybrid)
// 支持配置来源优先级（从高到低）：
// 1. JSON 文件 (VITE_DATA_CONFIG_PATH 指向 public 下路径或绝对 URL)
// 2. 环境变量单项：
//    - VITE_DATA_SOURCE_SHOWS_LIST=contract|backend|hybrid
//    - VITE_DATA_SOURCE_SHOW_DETAIL=contract|backend|hybrid
//    - VITE_DATA_SOURCE_MERGE_POLICY=JSON
// 运行时可通过 setDataSourceConfig 动态调整（例如在调试面板里切换）
// 提供订阅机制用于 React 层对配置变更做响应刷新。
// 加载 JSON 失败不会中断；保留已有配置并打印 warning。

export type DataSourceChoice = "contract" | "backend" | "hybrid";

export type FieldMergeMode = "preferContract" | "preferBackend" | "coalesce"; // coalesce: backend 覆盖但允许为空时回落

export interface MergePolicy {
  // 列表层级字段
  listFields?: Partial<Record<string, FieldMergeMode>>;
  // 详情层级字段
  detailFields?: Partial<Record<string, FieldMergeMode>>;
  // 默认模式
  defaultMode?: FieldMergeMode;
}

export interface DataSourceConfig {
  showsList: DataSourceChoice;
  showDetail: DataSourceChoice;
  mergePolicy: MergePolicy;
}

const VALID: DataSourceChoice[] = ["contract", "backend", "hybrid"];
function parseChoice(
  raw: string | undefined,
  fallback: DataSourceChoice
): DataSourceChoice {
  if (!raw) return fallback;
  const v = raw.toLowerCase();
  return (VALID as string[]).includes(v) ? (v as DataSourceChoice) : fallback;
}

// 可通过 JSON 环境变量提供字段策略：VITE_DATA_SOURCE_MERGE_POLICY
// 例如: {"defaultMode":"coalesce","listFields":{"description":"preferBackend"}}
function parseMergePolicy(raw: string | undefined): MergePolicy {
  if (!raw) return { defaultMode: "coalesce" };
  try {
    const obj = JSON.parse(raw);
    return {
      defaultMode: obj.defaultMode || "coalesce",
      listFields: obj.listFields || {},
      detailFields: obj.detailFields || {},
    };
  } catch {
    return { defaultMode: "coalesce" };
  }
}

let config: DataSourceConfig = {
  showsList: parseChoice(
    (import.meta as any)?.env?.VITE_DATA_SOURCE_SHOWS_LIST,
    "contract"
  ),
  showDetail: parseChoice(
    (import.meta as any)?.env?.VITE_DATA_SOURCE_SHOW_DETAIL,
    "contract"
  ),
  mergePolicy: parseMergePolicy(
    (import.meta as any)?.env?.VITE_DATA_SOURCE_MERGE_POLICY
  ),
};

// localStorage 键名
const LS_KEY = "__DATA_SOURCE_CONFIG_OVERRIDE__";

function loadLocalStorageOverride(): Partial<DataSourceConfig> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const next: Partial<DataSourceConfig> = {};
    if (obj.showsList)
      (next as any).showsList = parseChoice(obj.showsList, config.showsList);
    if (obj.showDetail)
      (next as any).showDetail = parseChoice(obj.showDetail, config.showDetail);
    if (obj.mergePolicy) {
      const mp = obj.mergePolicy;
      (next as any).mergePolicy = {
        defaultMode: mp.defaultMode || config.mergePolicy.defaultMode,
        listFields: mp.listFields || config.mergePolicy.listFields,
        detailFields: mp.detailFields || config.mergePolicy.detailFields,
      };
    }
    return next;
  } catch (e) {
    console.warn("[dataSource] parse localStorage override failed", e);
    return null;
  }
}

function persistLocalStorageOverride(partial: Partial<DataSourceConfig>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...partial };
    window.localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("[dataSource] persist override failed", e);
  }
}

export function getDataSourceConfig(): DataSourceConfig {
  return config;
}

export function setDataSourceConfig(partial: Partial<DataSourceConfig>) {
  config = { ...config, ...partial };
  if (typeof window !== "undefined") {
    (window as any).__DATA_SOURCE_CONFIG__ = config;
  }
  notify();
}

export function setDataSourceConfigAndPersist(
  partial: Partial<DataSourceConfig>
) {
  persistLocalStorageOverride(partial);
  setDataSourceConfig(partial);
}

// 订阅机制
type Listener = (cfg: DataSourceConfig) => void;
const listeners = new Set<Listener>();
function notify() {
  for (const l of listeners) l(config);
}
export function subscribeDataSourceConfig(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// JSON 文件动态加载
let loadPromise: Promise<void> | null = null;
export function ensureDataSourceConfigLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;
  const path = (import.meta as any)?.env?.VITE_DATA_CONFIG_PATH as
    | string
    | undefined;
  if (!path) return (loadPromise = Promise.resolve());
  loadPromise = (async () => {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ds = json?.dataSources || {};
      const mp = json?.mergePolicy;
      const next: Partial<DataSourceConfig> = {};
      if (ds.showsList)
        (next as any).showsList = parseChoice(ds.showsList, config.showsList);
      if (ds.showDetail)
        (next as any).showDetail = parseChoice(
          ds.showDetail,
          config.showDetail
        );
      if (mp) {
        (next as any).mergePolicy = {
          defaultMode: mp.defaultMode || config.mergePolicy.defaultMode,
          listFields: mp.listFields || config.mergePolicy.listFields,
          detailFields: mp.detailFields || config.mergePolicy.detailFields,
        };
      }
      if (Object.keys(next).length) setDataSourceConfig(next);
    } catch (e) {
      console.warn("[dataSource] Failed to load data config JSON", e);
    }
  })();
  return loadPromise;
}

if (typeof window !== "undefined") {
  (window as any).__DATA_SOURCE_CONFIG__ = config;
  // 异步尝试加载外部配置
  ensureDataSourceConfigLoaded().then(() => {
    // 加载完外部 JSON 后应用 localStorage 覆盖
    const override = loadLocalStorageOverride();
    if (override && Object.keys(override).length) {
      setDataSourceConfig(override);
    }
  });

  // 启动轮询（开发环境默认 5s，可通过 VITE_DATA_CONFIG_POLL_MS 调整）
  const intervalMsRaw = (import.meta as any)?.env?.VITE_DATA_CONFIG_POLL_MS;
  const intervalMs = parseInt(intervalMsRaw || "", 10);
  const pollMs = !isNaN(intervalMs) && intervalMs > 0 ? intervalMs : 5000;
  const path = (import.meta as any)?.env?.VITE_DATA_CONFIG_PATH as
    | string
    | undefined;
  if (path) {
    let lastSerialized = "";
    async function poll() {
      try {
        // 由于上层已判断 path 存在，这里断言为 string
        const res = await fetch(path as string, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const serialized = JSON.stringify(json);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          const ds = json?.dataSources || {};
          const mp = json?.mergePolicy;
          const next: Partial<DataSourceConfig> = {};
          if (ds.showsList)
            (next as any).showsList = parseChoice(
              ds.showsList,
              config.showsList
            );
          if (ds.showDetail)
            (next as any).showDetail = parseChoice(
              ds.showDetail,
              config.showDetail
            );
          if (mp) {
            (next as any).mergePolicy = {
              defaultMode: mp.defaultMode || config.mergePolicy.defaultMode,
              listFields: mp.listFields || config.mergePolicy.listFields,
              detailFields: mp.detailFields || config.mergePolicy.detailFields,
            };
          }
          if (Object.keys(next).length) {
            // 变更时：先应用 JSON，然后再应用 localStorage override（保持 override 优先级）
            setDataSourceConfig(next);
            const override = loadLocalStorageOverride();
            if (override && Object.keys(override).length) {
              setDataSourceConfig(override);
            }
          }
        }
      } catch (e) {
        // 静默：避免在离线/临时错误时刷屏
      } finally {
        schedule();
      }
    }
    function schedule() {
      setTimeout(poll, pollMs);
    }
    // 仅在开发模式下启用自动轮询，可通过显式变量 VITE_DATA_CONFIG_POLL_ENABLE=true 在生产打开
    const enablePoll =
      (import.meta as any)?.env?.VITE_DATA_CONFIG_POLL_ENABLE === "true" ||
      (import.meta as any)?.env?.DEV;
    if (enablePoll) {
      schedule();
    }
  }
}

// 导出用于 Dev 面板的工具函数
export function resetLocalOverride() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {}
  // 重新加载一次（确保 JSON + env base 生效）
  ensureDataSourceConfigLoaded().then(() => {
    notify();
  });
}

export function exportCurrentConfig(): DataSourceConfig {
  return { ...config };
}
