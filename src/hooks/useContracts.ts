import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther, decodeEventLog } from 'viem';
import React, { useState } from 'react';
import { useWallet } from './useWallet';
import { ABIS, getAddress } from '../abis';
import { useAccount } from 'wagmi';
import { useToast } from '../components/feedback/ToastProvider';
import { useTxQueue } from '../lib/txQueue';

// Event 数据类型
export interface Event {
  id: bigint;
  name: string;
  description: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  ticketPrice: bigint;
  maxTickets: bigint;
  soldTickets: bigint;
  organizer: string;
  isActive: boolean;
}

// Hook: 获取所有活动
export function useGetAllEvents() {
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const eventManagerAddress = getAddress('eventManager', chain?.id);
  const { data: eventIdsRaw, isLoading, error, refetch } = useReadContract({
    address: eventManagerAddress,
    abi: ABIS.eventManager,
    functionName: 'getAllEvents',
    query: { enabled: !!eventManagerAddress },
  });
  const eventIds = eventIdsRaw as readonly bigint[] | undefined;

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [batchError, setBatchError] = useState<Error | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      if (!publicClient || !eventManagerAddress || !eventIds || eventIds.length === 0) {
        setEvents([]); return;
      }
      setEventsLoading(true);
      setBatchError(undefined);
      try {
        // multicall 优化批量读取
        const contracts = (eventIds as bigint[]).map((id) => ({
          address: eventManagerAddress,
          abi: ABIS.eventManager as any,
          functionName: 'getEvent' as const,
          args: [id] as const,
        }));
        const multiRes = await publicClient.multicall({
          contracts,
          allowFailure: true,
        });
        const results = multiRes.map((res, idx) => {
          const id = eventIds[idx] as bigint;
          if (res.status === 'success') {
            const data: any = res.result;
            return {
              id: data[0] as bigint,
              name: data[1] as string,
              description: data[2] as string,
              venue: data[3] as string,
              startTime: new Date(Number(data[4]) * 1000),
              endTime: new Date(Number(data[5]) * 1000),
              ticketPrice: data[6] as bigint,
              maxTickets: data[7] as bigint,
              soldTickets: data[8] as bigint,
              organizer: data[9] as string,
              isActive: data[10] as boolean,
            } satisfies Event;
          }
          const e: any = res.error;
          return {
            id,
            name: '加载失败',
            description: e?.shortMessage || e?.message || '无法获取活动详情',
            venue: '-',
            startTime: new Date(0),
            endTime: new Date(0),
            ticketPrice: BigInt(0),
            maxTickets: BigInt(0),
            soldTickets: BigInt(0),
            organizer: '0x0000000000000000000000000000000000000000',
            isActive: false,
          } satisfies Event;
        });
        if (!cancelled) {
          // 按 id 排序，保证稳定
          setEvents(results.sort((a,b) => (a.id < b.id ? -1 : 1)));
        }
      } catch (e: any) {
        if (!cancelled) setBatchError(e);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }
    loadDetails();
    return () => { cancelled = true; };
  }, [eventIds, eventManagerAddress, publicClient]);

  return {
    events,
    isLoading: isLoading || eventsLoading,
    error: error || batchError,
    refetch,
  };
}

// Hook: 获取单个活动
export function useGetEvent(eventId: string | undefined) {
  const { chain } = useAccount();
  const eventManagerAddress = getAddress('eventManager', chain?.id);
  type EventTuple = [bigint,string,string,string,bigint,bigint,bigint,bigint,bigint,string,boolean];
  const { data: eventDataRaw, isLoading, error, refetch } = useReadContract({
    address: eventManagerAddress,
    abi: ABIS.eventManager,
    functionName: 'getEvent',
    args: eventId && eventManagerAddress ? [BigInt(eventId)] : undefined,
    query: { enabled: !!eventId && !!eventManagerAddress },
  });
  const eventData = eventDataRaw as unknown as EventTuple | undefined;

  const event: Event | undefined = eventData ? {
    id: eventData[0],
    name: eventData[1],
    description: eventData[2],
    venue: eventData[3],
    startTime: new Date(Number(eventData[4]) * 1000),
    endTime: new Date(Number(eventData[5]) * 1000),
    ticketPrice: eventData[6],
    maxTickets: eventData[7],
    soldTickets: eventData[8],
    organizer: eventData[9],
    isActive: eventData[10],
  } : undefined;

  return { event, isLoading, error, refetch };
}

// Hook: 创建活动
export function useCreateEvent() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const eventManagerAddress = getAddress('eventManager', chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [newEventId, setNewEventId] = React.useState<bigint | null>(null);
  const { trackWalletAction, markSent, markConfirming, markSuccess, markFailed } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const queryClient = useQueryClient();

  const createEvent = async (eventData: {
    name: string;
    description: string;
    venue: string;
    startTime: Date;
    endTime: Date;
    ticketPrice: string;
    maxTickets: number;
  }) => {
    if (!address) throw new Error('请先连接钱包');
    if (!eventManagerAddress) throw new Error('缺少 EventManager 地址');

    try {
      const tempId = trackWalletAction({ title: '创建活动', description: eventData.name, chainId: chain?.id });
      tempRef.current = tempId;
      writeContract({
        address: eventManagerAddress,
        abi: ABIS.eventManager,
        functionName: 'createEvent',
        args: [
          eventData.name,
          eventData.description,
          eventData.venue,
          BigInt(Math.floor(eventData.startTime.getTime() / 1000)),
          BigInt(Math.floor(eventData.endTime.getTime() / 1000)),
          parseEther(eventData.ticketPrice),
          BigInt(eventData.maxTickets),
        ],
      });
    } catch (e: any) {
      if (tempRef.current) markFailed(hashRef.current as any, e?.message);
      push({ type: 'error', title: '创建失败', description: e?.shortMessage || e?.message });
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

  // 解析链上日志获取新创建的 eventId
  React.useEffect(() => {
    if (!isSuccess || !receipt || !eventManagerAddress) return;
    if (newEventId) return; // 已解析
    try {
  for (const log of receipt.logs || []) {
        try {
          const parsed = decodeEventLog({
            abi: ABIS.eventManager,
            data: log.data,
    topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
          });
          if (parsed.eventName === 'EventCreated') {
    // EventCreated(eventId, organizer, name)
    // parsed.args 可能是具名或位置数组
    const args: any = parsed.args as any;
    const id: bigint | undefined = args?.eventId ?? args?.[0];
    if (typeof id === 'bigint') setNewEventId(id);
            break;
          }
        } catch (_) {
          // 忽略非本合约事件或解析失败
        }
      }
    } catch (e) {
      // 解析失败不阻断主流程
    }
  }, [isSuccess, receipt, eventManagerAddress, newEventId]);

  // 成功后失效事件列表查询
  React.useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (newEventId) queryClient.invalidateQueries({ queryKey: ['event', newEventId.toString()] });
    }
  }, [isSuccess, newEventId, queryClient]);

  return { createEvent, hash, isPending, isConfirming, isSuccess, error, newEventId };
}

// Hook: 购买门票
export function useMintTicket() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const ticketManagerAddress = getAddress('ticketManager', chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { trackWalletAction, markSent, markConfirming, markSuccess, markFailed } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const queryClient = useQueryClient();
  const targetEventRef = React.useRef<string | null>(null);

  const mintTicket = async (eventId: string, quantity: number, ticketPrice: bigint) => {
    if (!address) throw new Error('请先连接钱包');
    if (!ticketManagerAddress) throw new Error('缺少 TicketManager 地址');

    const totalPrice = ticketPrice * BigInt(quantity);

    try {
  targetEventRef.current = eventId;
  const tempId = trackWalletAction({ title: '购票', description: `活动 #${eventId} x${quantity}`, chainId: chain?.id });
      tempRef.current = tempId;
      writeContract({
        address: ticketManagerAddress,
        abi: ABIS.ticketManager,
        functionName: 'mintTicket',
        args: [BigInt(eventId), BigInt(quantity)],
        value: totalPrice,
      });
    } catch (e: any) {
      if (tempRef.current) markFailed(hashRef.current as any, e?.message);
      push({ type: 'error', title: '购票失败', description: e?.shortMessage || e?.message });
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
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (targetEventRef.current) queryClient.invalidateQueries({ queryKey: ['event', targetEventRef.current] });
    }
  }, [isSuccess, queryClient]);

  return { mintTicket, hash, isPending, isConfirming, isSuccess, error };
}

// Hook: 转让门票
export function useTransferTicket() {
  const { address } = useWallet();
  const { chain } = useAccount();
  const { push } = useToast();
  const ticketManagerAddress = getAddress('ticketManager', chain?.id);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { trackWalletAction, markSent, markConfirming, markSuccess, markFailed } = useTxQueue();
  const tempRef = React.useRef<string | null>(null);
  const hashRef = React.useRef<`0x${string}` | undefined>(undefined);
  const queryClient = useQueryClient();
  const targetEventRef = React.useRef<string | null>(null); // 若未来需要由 tokenId 推断 event

  const transferTicket = async (to: string, tokenId: string) => {
    if (!address) throw new Error('请先连接钱包');
    if (!ticketManagerAddress) throw new Error('缺少 TicketManager 地址');

    try {
      const tempId = trackWalletAction({ title: '转让门票', description: `Token #${tokenId}`, chainId: chain?.id });
      tempRef.current = tempId;
      writeContract({
        address: ticketManagerAddress,
        abi: ABIS.ticketManager,
        functionName: 'transferFrom',
        args: [address, to as `0x${string}`, BigInt(tokenId)],
      });
    } catch (e: any) {
      if (tempRef.current) markFailed(hashRef.current as any, e?.message);
      push({ type: 'error', title: '转让失败', description: e?.shortMessage || e?.message });
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
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (targetEventRef.current) queryClient.invalidateQueries({ queryKey: ['event', targetEventRef.current] });
    }
  }, [isSuccess, queryClient]);

  return { transferTicket, hash, isPending, isConfirming, isSuccess, error };
}
