import { useQuery } from "@tanstack/react-query";
import { useGetAllEvents, useGetEvent, type Event } from "./useContracts";

// 后端优先、链上兜底的最小实现
// 约定后端接口：
// - GET ${VITE_API_BASE_URL}/events           -> EventView[]
// - GET ${VITE_API_BASE_URL}/events/:id       -> EventView

const API_BASE: string | undefined = (import.meta as any).env
  ?.VITE_API_BASE_URL as string | undefined;

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  if (typeof v === "string") return BigInt(v);
  return BigInt(0);
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // 支持秒/毫秒
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms);
  }
  if (typeof v === "string") {
    // ISO 或秒数字符串
    const n = Number(v);
    if (!Number.isNaN(n)) return toDate(n);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }
  return new Date(0);
}

function normalizeEvent(json: any): Event {
  return {
    id: toBigInt(json?.id ?? json?.eventId ?? 0),
    name: String(json?.name ?? ""),
    description: String(json?.description ?? json?.desc ?? ""),
    location: String(json?.location ?? json?.loc ?? ""),
    startTime: toDate(json?.startTime ?? json?.start ?? 0),
    endTime: toDate(json?.endTime ?? json?.end ?? 0),
    ticketPrice: toBigInt(json?.ticketPrice ?? json?.price ?? 0),
    maxTickets: toBigInt(json?.maxTickets ?? json?.capacity ?? 0),
    soldTickets: toBigInt(json?.soldTickets ?? json?.sold ?? 0),
    organizer: String(
      json?.organizer ??
        json?.organiser ??
        "0x0000000000000000000000000000000000000000"
    ),
    isActive: Boolean(json?.isActive ?? json?.active ?? false),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// 获取单个活动（后端优先，链上兜底）
export function useEvent(eventId: string | undefined) {
  const backendEnabled = Boolean(API_BASE && eventId);

  const {
    data: backendData,
    isLoading: backendLoading,
    error: backendError,
    refetch: refetchBackend,
  } = useQuery({
    queryKey: ["event-api", eventId],
    enabled: backendEnabled,
    queryFn: async () => {
      const raw = await fetchJson<any>(`${API_BASE}/events/${eventId}`);
      return normalizeEvent(raw);
    },
    staleTime: 10_000,
  });

  // 链上兜底（现有实现）
  const {
    event: onchainEvent,
    isLoading: onchainLoading,
    error: onchainError,
    refetch: refetchOnchain,
  } = useGetEvent(eventId);

  const event = backendData ?? onchainEvent;

  // 加载状态：若后端有数据则不再受链上loading影响
  const isLoading = backendLoading || (!backendData && onchainLoading);
  // 错误：只有当两边都没有数据时才暴露错误，优先后端错误
  const error =
    !event && (backendError || onchainError)
      ? backendError || onchainError
      : undefined;

  const refetch = async () => {
    // 并行刷新，两边都尝试
    await Promise.allSettled([
      backendEnabled ? refetchBackend() : Promise.resolve(),
      refetchOnchain(),
    ]);
  };

  return { event, isLoading, error, refetch } as const;
}

// 获取活动列表（后端优先，链上兜底）
export function useEvents() {
  const backendEnabled = Boolean(API_BASE);

  const {
    data: backendList,
    isLoading: backendLoading,
    error: backendError,
    refetch: refetchBackend,
  } = useQuery({
    queryKey: ["events-api"],
    enabled: backendEnabled,
    queryFn: async () => {
      const raw = await fetchJson<any[]>(`${API_BASE}/events`);
      return raw.map(normalizeEvent);
    },
    staleTime: 10_000,
  });

  const {
    events: onchainList,
    isLoading: onchainLoading,
    error: onchainError,
    refetch: refetchOnchain,
  } = useGetAllEvents();

  const events = backendList ?? onchainList;
  const isLoading = backendLoading || (!backendList && onchainLoading);
  const error =
    (!events || events.length === 0) && (backendError || onchainError)
      ? backendError || onchainError
      : undefined;

  const refetch = async () => {
    await Promise.allSettled([
      backendEnabled ? refetchBackend() : Promise.resolve(),
      refetchOnchain(),
    ]);
  };

  return { events: events ?? [], isLoading, error, refetch } as const;
}
