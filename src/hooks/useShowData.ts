import { useBackendShow, useBackendShows } from "./useBackendShows";
import { useGetShow, useGetAllShows } from "./useContracts";
import { normalizeShowFromBackend } from "../lib/normalizeShow";
// getDataSourceConfig 不再直接使用，改为订阅 Hook
import { useDataSourceConfig } from "./useDataSourceConfig";
import type { ShowListParams } from "../types/show";

// 统一列表 Hook：根据配置选择数据源
export interface UnifiedShowListItem {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime: Date;
  _contract?: any; // 合约原始对象
  _backend?: any; // 后端原始对象
}

export interface UnifiedShowDetail extends UnifiedShowListItem {
  metadataURI?: string;
  ticketPrice?: bigint;
  maxTickets?: bigint;
  soldTickets?: bigint;
  organizer?: string;
  isActive?: boolean;
  status?: number;
}

export interface UseShowsDataResult {
  source: "contract" | "backend" | "hybrid";
  data: UnifiedShowListItem[] | undefined;
  loading: boolean;
  fetching?: boolean;
  error: unknown;
  refetch: () => void;
  contract: ReturnType<typeof useGetAllShows>;
  backend: ReturnType<typeof useBackendShows>;
}

// 列表 Hook：根据配置组合数据源
export function useShowsData(params: ShowListParams = {}): UseShowsDataResult {
  const cfg = useDataSourceConfig();
  const useContract = cfg.showsList === "contract";
  const useBackend = cfg.showsList === "backend";

  const contract = useGetAllShows();
  const backend = useBackendShows(params);

  if (useContract) {
    const list: UnifiedShowListItem[] | undefined = contract.shows
      ? contract.shows.map((s) => ({
          id: s.id.toString(),
          name: s.name,
          description: s.description,
          location: s.location,
          startTime: s.startTime,
          _contract: s,
        }))
      : undefined;
    return {
      source: "contract",
      data: list,
      loading: contract.isLoading,
      fetching: contract.isLoading, // 简化：合约无区分 fetching
      error: contract.error,
      refetch: contract.refetch,
      contract,
      backend,
    };
  }

  if (useBackend) {
    const list: UnifiedShowListItem[] | undefined = backend.data
      ? backend.data.map((b: any) => {
          const n = normalizeShowFromBackend(b)!; // normalize 始终返回对象
          return {
            id: n.id,
            name: n.name,
            description: n.description,
            location: n.location,
            startTime: n.startTime,
            _backend: b,
          };
        })
      : undefined;
    return {
      source: "backend",
      data: list,
      loading: backend.loading,
      fetching: backend.fetching,
      error: backend.error,
      refetch: backend.refetch,
      contract,
      backend,
    };
  }

  // hybrid: 字段级别合并
  const policy = cfg.mergePolicy;
  function mergeField(field: string, cVal: any, bVal: any) {
    const mode = policy.listFields?.[field] || policy.defaultMode || "coalesce";
    switch (mode) {
      case "preferContract":
        return cVal !== undefined && cVal !== null && cVal !== "" ? cVal : bVal;
      case "preferBackend":
        return bVal !== undefined && bVal !== null && bVal !== "" ? bVal : cVal;
      case "coalesce":
      default:
        return bVal ?? cVal;
    }
  }

  const backendMap: Record<
    string,
    ReturnType<typeof normalizeShowFromBackend>
  > = {};
  (backend.data || []).forEach((b: any) => {
    const n = normalizeShowFromBackend(b)!;
    backendMap[n.id] = n;
  });

  const merged: UnifiedShowListItem[] | undefined = contract.shows
    ? contract.shows.map((c) => {
        const bn = backendMap[c.id.toString()];
        return {
          id: c.id.toString(),
          name: mergeField("name", c.name, bn?.name),
          description: mergeField(
            "description",
            c.description,
            bn?.description
          ),
          location: mergeField("location", c.location, bn?.location),
          startTime: c.startTime,
          _contract: c,
          _backend: bn ? (bn as any)._raw : undefined,
        };
      })
    : undefined;

  return {
    source: "hybrid",
    data: merged,
    loading: contract.isLoading && backend.loading,
    fetching: contract.isLoading || backend.fetching || backend.loading,
    error: contract.error || backend.error,
    refetch: () => {
      contract.refetch();
      backend.refetch();
    },
    contract,
    backend,
  };
}

// 统一详情 Hook：根据配置选择策略
export interface UseShowDataResult {
  source: "contract" | "backend" | "hybrid";
  data: UnifiedShowDetail | undefined;
  loading: boolean;
  fetching?: boolean;
  error: unknown;
  refetch: () => void;
  contract: ReturnType<typeof useGetShow>;
  backend: ReturnType<typeof useBackendShow>;
}

export function useShowData(id: string | undefined): UseShowDataResult {
  // 订阅 detail 数据源变化
  const cfg = useDataSourceConfig();
  const useContract = cfg.showDetail === "contract";
  const useBackend = cfg.showDetail === "backend";

  const contract = useGetShow(id);
  const backend = useBackendShow(id);

  if (useContract) {
    return {
      source: "contract" as const,
      data: contract.show
        ? {
            id: contract.show.id.toString(),
            name: contract.show.name,
            description: contract.show.description,
            location: contract.show.location,
            startTime: contract.show.startTime,
            _contract: contract.show,
          }
        : undefined,
      loading: contract.isLoading,
      error: contract.error,
      refetch: contract.refetch,
      contract,
      backend,
    };
  }
  if (useBackend) {
    const adapted = backend.data
      ? normalizeShowFromBackend(backend.data)
      : undefined;
    return {
      source: "backend" as const,
      data: adapted,
      loading: backend.loading,
      error: backend.error,
      refetch: backend.refetch,
      contract,
      backend,
    };
  }
  // hybrid: 优先合约，后端覆盖字段
  const detailPolicy = cfg.mergePolicy;
  function mergeDetailField(field: string, cVal: any, bVal: any) {
    const mode =
      detailPolicy.detailFields?.[field] ||
      detailPolicy.defaultMode ||
      "coalesce";
    switch (mode) {
      case "preferContract":
        return cVal !== undefined && cVal !== null && cVal !== "" ? cVal : bVal;
      case "preferBackend":
        return bVal !== undefined && bVal !== null && bVal !== "" ? bVal : cVal;
      case "coalesce":
      default:
        return bVal ?? cVal;
    }
  }

  const backendNormalized = backend.data
    ? normalizeShowFromBackend(backend.data)
    : undefined;
  const merged = contract.show
    ? (() => {
        // 合约主数据 + 后端补丁
        const c = contract.show;
        const bn = backendNormalized;
        return {
          id: c.id.toString(),
          name: mergeDetailField("name", c.name, bn?.name),
          description: mergeDetailField(
            "description",
            c.description,
            bn?.description
          ),
          location: mergeDetailField("location", c.location, bn?.location),
          startTime: c.startTime,
          metadataURI: c.metadataURI || bn?.metadataURI,
          ticketPrice: c.ticketPrice,
          maxTickets: c.maxTickets,
          soldTickets: c.soldTickets,
          organizer: c.organizer,
          isActive: c.isActive,
          status: c.status,
          _contract: c,
          _backend: backend.data,
        } as UnifiedShowDetail;
      })()
    : backendNormalized
    ? ({
        id: backendNormalized.id,
        name: backendNormalized.name,
        description: backendNormalized.description,
        location: backendNormalized.location,
        startTime: backendNormalized.startTime,
        metadataURI: backendNormalized.metadataURI,
        ticketPrice: backendNormalized.ticketPrice,
        maxTickets: backendNormalized.maxTickets,
        soldTickets: backendNormalized.soldTickets,
        organizer: backendNormalized.organizer,
        isActive: backendNormalized.isActive,
        status: backendNormalized.status,
        _backend: backend.data,
      } as UnifiedShowDetail)
    : undefined;

  return {
    source: "hybrid" as const,
    data: merged,
    loading: contract.isLoading && backend.loading,
    fetching: contract.isLoading || backend.loading,
    error: contract.error || backend.error,
    refetch: () => {
      contract.refetch();
      backend.refetch();
    },
    contract,
    backend,
  };
}
