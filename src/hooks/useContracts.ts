import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther, decodeEventLog } from "viem";
import React from "react";
import { useWallet } from "./useWallet";
import { ABIS, getAddress } from "../abis";
import { buildIpfsHttpUrl } from "../lib/ipfs.ts";
import { useAccount } from "wagmi";
import { useToast } from "../components/feedback/ToastProvider";
import { useTxQueue } from "../lib/txQueue";
import { mapError } from "../lib/errors";
import { startSpan, endSpan, logError } from "../lib/observability";

// Show 数据类型（由原 Event 重命名）。
export interface Show {
  id: bigint;
  name: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  ticketPrice: bigint;
  maxTickets: bigint;
  soldTickets: bigint;
  organizer: string;
  isActive: boolean;
  status: ShowStatus;
  metadataURI?: string;
  metadata?: any; // 解析后的 IPFS 元数据（可选结构）
}

export const ShowStatus = {
  Upcoming: 0,
  Active: 1,
  Ended: 2,
  Cancelled: 3,
} as const;
export type ShowStatus = (typeof ShowStatus)[keyof typeof ShowStatus];

// Hook: 获取所有演出列表（改为直接调用 ShowManager.getShows）
export function useGetAllShows() {
  const { chain } = useAccount();
  const showManagerAddress = getAddress("showManager", chain?.id);

  const { data, isLoading, error, refetch } = useReadContract({
    address: showManagerAddress,
    abi: ABIS.showManager,
    functionName: "getShows",
    query: { enabled: !!showManagerAddress },
  });

  function mapRawShow(raw: any): Show | null {
    if (!raw) return null;
    // viem 可能返回：
    // 1) 数组形式（含数字索引和具名属性）
    // 2) 纯对象形式 { id, startTime, ... }
    const get = (kIdx: number, kName: string) => {
      if (Array.isArray(raw)) return raw[kIdx];
      return raw[kName as keyof typeof raw];
    };
    try {
      const id = get(0, "id");
      if (typeof id === "undefined") return null;
      const startTime = get(1, "startTime");
      const endTime = get(2, "endTime");
      const totalTickets = get(3, "totalTickets");
      const ticketsSold = get(4, "ticketsSold");
      const ticketPrice = get(5, "ticketPrice");
      const organizer = get(6, "organizer");
      const location = get(7, "location");
      const name = get(8, "name");
      const description = get(9, "description");
      const metadataURI = get(10, "metadataURI");
      const statusRaw = get(11, "status");
      const statusNum = Number(statusRaw ?? 0);
      return {
        id: BigInt(id),
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        maxTickets: BigInt(totalTickets ?? 0),
        soldTickets: BigInt(ticketsSold ?? 0),
        ticketPrice: BigInt(ticketPrice ?? 0),
        organizer: organizer || "0x0000000000000000000000000000000000000000",
        location: location || "-",
        name: name || "(未命名)",
        description: description || "",
        metadataURI: metadataURI || "",
        status: statusNum as ShowStatus,
        isActive: statusNum === ShowStatus.Active,
        metadata: undefined,
      } satisfies Show;
    } catch (e) {
      return null;
    }
  }

  const rawArray: any[] = Array.isArray(data) ? (data as any[]) : [];
  const shows: Show[] = rawArray
    .map(mapRawShow)
    .filter((s): s is Show => !!s)
    .sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1));

  return { shows, isLoading, error, refetch };
}

// Hook: 获取单个演出/活动详情（原 useGetEvent）
export function useGetShow(showId: string | undefined) {
  const { chain } = useAccount();
  const showManagerAddress = getAddress("showManager", chain?.id);

  // 无效 showId（空 / 非数字）时不发起请求
  const enabled =
    !!showManagerAddress &&
    !!showId &&
    showId.trim() !== "" &&
    !Number.isNaN(Number(showId));

  let numericId: bigint | undefined;
  if (enabled) {
    try {
      numericId = BigInt(showId as string);
      console.log("Parsed showId:", numericId);
    } catch (e) {
      // 解析失败则禁用请求
      console.error("Failed to parse showId:", e);
    }
  }

  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: showManagerAddress,
    abi: ABIS.showManager,
    functionName: "getShow",
    args: numericId !== undefined ? [numericId] : undefined,
    query: { enabled: enabled && numericId !== undefined },
  });

  function mapSingle(raw: any): Show | undefined {
    if (!raw) return undefined;
    const get = (kIdx: number, kName: string) => {
      if (Array.isArray(raw)) return raw[kIdx];
      return raw[kName as keyof typeof raw];
    };
    try {
      const id = get(0, "id");
      if (typeof id === "undefined") return undefined;
      const startTime = get(1, "startTime");
      const endTime = get(2, "endTime");
      const totalTickets = get(3, "totalTickets");
      const ticketsSold = get(4, "ticketsSold");
      const ticketPrice = get(5, "ticketPrice");
      const organizer = get(6, "organizer");
      const location = get(7, "location");
      const name = get(8, "name");
      const description = get(9, "description");
      const metadataURI = get(10, "metadataURI");
      const statusRaw = get(11, "status");
      const statusNum = Number(statusRaw ?? 0);
      return {
        id: BigInt(id),
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        maxTickets: BigInt(totalTickets ?? 0),
        soldTickets: BigInt(ticketsSold ?? 0),
        ticketPrice: BigInt(ticketPrice ?? 0),
        organizer: organizer || "0x0000000000000000000000000000000000000000",
        location: location || "-",
        name: name || "(未命名)",
        description: description || "",
        metadataURI: metadataURI || "",
        status: statusNum as ShowStatus,
        isActive: statusNum === ShowStatus.Active,
        metadata: undefined,
      };
    } catch (_) {
      return undefined;
    }
  }
  const show: Show | undefined = mapSingle(rawData);
  // console.log("Raw show data:", rawData, "Parsed show object:", show);
  return { show, isLoading, error, refetch };
}

// Hook: 创建活动
export function useCreateShow() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const showManagerAddress = getAddress("showManager", chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({ hash });
  const [newShowId, setNewShowId] = React.useState<bigint | null>(null);
  const {
    trackWalletAction,
    markSent,
    markConfirming,
    markSuccess,
    markFailed,
  } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const submittingRef = React.useRef<boolean>(false);
  const didSentRef = React.useRef<boolean>(false);
  const didConfirmingRef = React.useRef<boolean>(false);
  const didSuccessRef = React.useRef<boolean>(false);
  const queryClient = useQueryClient();

  const createShow = async (showData: {
    name: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
    ticketPrice: string;
    totalTickets: number;
    ipfs_cid: string;
  }) => {
    if (!address) throw new Error("请先连接钱包");
    if (!showManagerAddress) throw new Error("缺少 ShowManager 地址");
    if (submittingRef.current) return; // 防重复提交

    const span = startSpan("createShow");
    try {
      submittingRef.current = true;
      const tempId = trackWalletAction({
        title: "创建活动",
        description: showData.name,
        chainId: chain?.id,
      });
      tempRef.current = tempId;
      writeContract({
        address: showManagerAddress,
        abi: ABIS.showManager,
        functionName: "createShow",
        args: [
          showData.name,
          showData.description,
          BigInt(Math.floor(showData.startTime.getTime() / 1000)),
          BigInt(Math.floor(showData.endTime.getTime() / 1000)),
          showData.location,
          BigInt(showData.totalTickets),
          parseEther(showData.ticketPrice),
          showData.ipfs_cid,
        ],
      });
    } catch (e: any) {
      const mapped = mapError(e);
      if (tempRef.current)
        markFailed(hashRef.current as any, mapped.rawMessage);
      push({ type: "error", title: "创建失败", description: mapped.message });
      logError("createShow failed", e);
      throw e;
    } finally {
      endSpan(span);
    }
  };

  React.useEffect(() => {
    if (hash && tempRef.current && !didSentRef.current) {
      hashRef.current = hash;
      markSent(tempRef.current, hash);
      didSentRef.current = true;
    }
  }, [hash, markSent]);

  React.useEffect(() => {
    if (isConfirming && hashRef.current && !didConfirmingRef.current) {
      markConfirming(hashRef.current);
      didConfirmingRef.current = true;
    }
    if (!isConfirming) {
      didConfirmingRef.current = false;
    }
  }, [isConfirming, markConfirming]);

  React.useEffect(() => {
    if (isSuccess && hashRef.current && !didSuccessRef.current) {
      markSuccess(hashRef.current);
      didSuccessRef.current = true;
    }
  }, [isSuccess, markSuccess]);

  // 解析链上日志获取新创建的 showId
  React.useEffect(() => {
    if (!isSuccess || !receipt || !showManagerAddress) return;
    if (newShowId) return; // 已解析
    try {
      for (const log of receipt.logs || []) {
        try {
          const parsed = decodeEventLog({
            abi: ABIS.showManager,
            data: log.data,
            topics: log.topics as [
              signature: `0x${string}`,
              ...args: `0x${string}`[]
            ],
          });
          if (parsed.eventName === "ShowCreated") {
            // parsed.args 可能是具名或位置数组
            const args: any = parsed.args as any;
            const id: bigint | undefined = args?.showId ?? args?.[0];
            if (typeof id === "bigint") setNewShowId(id);
            break;
          }
        } catch (_) {
          // 忽略非本合约事件或解析失败
        }
      }
    } catch (e) {
      // 解析失败不阻断主流程
    }
  }, [isSuccess, receipt, showManagerAddress, newShowId]);

  // 交易生命周期结束后释放提交锁
  React.useEffect(() => {
    if (!isPending && !isConfirming) submittingRef.current = false;
  }, [isPending, isConfirming]);

  // 成功后失效演出列表查询
  React.useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      if (typeof newShowId === "bigint") {
        queryClient.invalidateQueries({
          queryKey: ["show", newShowId.toString()],
        });
      }
    }
  }, [isSuccess, newShowId, queryClient]);

  return {
    createShow,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    newShowId,
  };
}

// Hook: 购买门票
export function useMintTicket() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const ticketManagerAddress = getAddress("ticketManager", chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const {
    trackWalletAction,
    markSent,
    markConfirming,
    markSuccess,
    markFailed,
  } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const queryClient = useQueryClient();
  const targetShowRef = React.useRef<string | null>(null);

  const mintTicket = async (
    eventId: string,
    quantity: number,
    ticketPrice: bigint
  ) => {
    if (!address) throw new Error("请先连接钱包");
    if (!ticketManagerAddress) throw new Error("缺少 TicketManager 地址");

    const totalPrice = ticketPrice * BigInt(quantity);

    try {
      targetShowRef.current = eventId;
      const tempId = trackWalletAction({
        title: "购票",
        description: `活动 #${eventId} x${quantity}`,
        chainId: chain?.id,
      });
      tempRef.current = tempId;
      writeContract({
        address: ticketManagerAddress,
        abi: ABIS.ticketManager,
        functionName: "mintTicket",
        args: [BigInt(eventId), BigInt(quantity)],
        value: totalPrice,
      });
    } catch (e: any) {
      const mapped = mapError(e);
      if (tempRef.current)
        markFailed(hashRef.current as any, mapped.rawMessage);
      push({ type: "error", title: "购票失败", description: mapped.message });
      throw e;
    }
  };

  React.useEffect(() => {
    if (hash && tempRef.current) {
      hashRef.current = hash;
      markSent(tempRef.current, hash);
    }
  }, [hash, markSent]);

  React.useEffect(() => {
    if (isConfirming && hashRef.current) markConfirming(hashRef.current);
  }, [isConfirming, markConfirming]);

  React.useEffect(() => {
    if (isSuccess && hashRef.current) markSuccess(hashRef.current);
  }, [isSuccess, markSuccess]);

  React.useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      if (targetShowRef.current) {
        queryClient.invalidateQueries({
          queryKey: ["show", targetShowRef.current],
        });
      }
    }
  }, [isSuccess, queryClient]);

  return { mintTicket, hash, isPending, isConfirming, isSuccess, error };
}

// Hook: 转让门票
export function useTransferTicket() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const ticketManagerAddress = getAddress("ticketManager", chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const {
    trackWalletAction,
    markSent,
    markConfirming,
    markSuccess,
    markFailed,
  } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const queryClient = useQueryClient();
  const targetShowRef = React.useRef<string | null>(null); // 若未来需要由 tokenId 推断 show

  const transferTicket = async (to: string, tokenId: string) => {
    if (!address) throw new Error("请先连接钱包");
    if (!ticketManagerAddress) throw new Error("缺少 TicketManager 地址");

    try {
      const tempId = trackWalletAction({
        title: "转让门票",
        description: `Token #${tokenId}`,
        chainId: chain?.id,
      });
      tempRef.current = tempId;
      writeContract({
        address: ticketManagerAddress,
        abi: ABIS.ticketManager,
        functionName: "transferFrom",
        args: [address, to as `0x${string}`, BigInt(tokenId)],
      });
    } catch (e: any) {
      const mapped = mapError(e);
      if (tempRef.current)
        markFailed(hashRef.current as any, mapped.rawMessage);
      push({ type: "error", title: "转让失败", description: mapped.message });
      throw e;
    }
  };

  React.useEffect(() => {
    if (hash && tempRef.current) {
      hashRef.current = hash;
      markSent(tempRef.current, hash);
    }
  }, [hash, markSent]);

  React.useEffect(() => {
    if (isConfirming && hashRef.current) markConfirming(hashRef.current);
  }, [isConfirming, markConfirming]);

  React.useEffect(() => {
    if (isSuccess && hashRef.current) markSuccess(hashRef.current);
  }, [isSuccess, markSuccess]);

  React.useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      if (targetShowRef.current) {
        queryClient.invalidateQueries({
          queryKey: ["show", targetShowRef.current],
        });
      }
    }
  }, [isSuccess, queryClient]);

  return { transferTicket, hash, isPending, isConfirming, isSuccess, error };
}

// 通用：映射状态 -> 标签与样式
export function useShowStatusLabel() {
  const getStatus = (status: ShowStatus | number | bigint | undefined) => {
    const s = typeof status === "bigint" ? Number(status) : status;
    switch (s) {
      case ShowStatus.Upcoming:
        return { label: "未开始", color: "bg-gray-100 text-gray-700" };
      case ShowStatus.Active:
        return { label: "售票中", color: "bg-green-100 text-green-700" };
      case ShowStatus.Ended:
        return { label: "已结束", color: "bg-blue-100 text-blue-700" };
      case ShowStatus.Cancelled:
        return { label: "已取消", color: "bg-red-100 text-red-700" };
      default:
        return { label: "未知", color: "bg-yellow-100 text-yellow-700" };
    }
  };
  return { getStatus };
}

// 简单的 IPFS 元数据抓取 Hook（传入 Show 列表，批量补充 metadata）
export function useEnrichShowsWithMetadata(shows: Show[]) {
  const [enriched, setEnriched] = React.useState<Show[]>(shows);
  const enrichedRef = React.useRef(enriched);
  React.useEffect(() => {
    enrichedRef.current = enriched;
  }, [enriched]);

  // 数组标识简化为可比较 key，避免每次新数组导致无限循环
  const depKey = React.useMemo(
    () =>
      shows
        .map((s) => `${s.id.toString()}|${s.metadataURI ?? ""}|${!!s.metadata}`)
        .join(";"),
    [shows]
  );

  React.useEffect(() => {
    let cancelled = false;
    const simpleEqual = (a: Show[], b: Show[]) => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) return false;
        if (a[i].metadataURI !== b[i].metadataURI) return false;
        const am = !!(a[i] as any).metadata;
        const bm = !!(b[i] as any).metadata;
        if (am !== bm) return false;
      }
      return true;
    };

    async function run() {
      const needFetch = shows.filter(
        (s) =>
          s.metadataURI &&
          !s.metadata &&
          !s.metadataURI.startsWith("http-error:")
      );
      if (needFetch.length === 0) {
        if (!simpleEqual(enrichedRef.current, shows)) {
          setEnriched(shows);
        }
        return;
      }
      const results = await Promise.all(
        needFetch.map(async (s) => {
          try {
            const url = buildIpfsHttpUrl(s.metadataURI!);
            const resp = await fetch(url, { method: "GET" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json().catch(() => null);
            return { id: s.id, meta: json };
          } catch (e: any) {
            return { id: s.id, meta: { _error: e?.message || "fetch failed" } };
          }
        })
      );
      if (cancelled) return;
      const map = new Map(results.map((r) => [r.id.toString(), r.meta]));
      const next = shows.map((s) =>
        map.has(s.id.toString())
          ? { ...s, metadata: map.get(s.id.toString()) }
          : s
      );
      if (!simpleEqual(enrichedRef.current, next)) {
        setEnriched(next);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // 仅当关键字段变化时触发，避免因数组引用变化导致死循环
  }, [depKey]);

  return enriched;
}

// (旧别名 useGetAllEvents / useGetEvent 已移除)
