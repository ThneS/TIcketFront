import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import React, { useState } from 'react';
import { useWallet } from './useWallet';

// 合约地址配置 - 需要根据实际部署地址修改
const CONTRACT_ADDRESSES = {
  eventManager: '0x...',      // EventManager 合约地址
  ticketManager: '0x...',     // TicketManager 合约地址
  marketplace: '0x...',       // Marketplace 合约地址
  platformToken: '0x...',     // PlatformToken 合约地址
} as const;

// EventManager ABI (简化版)
const EVENT_MANAGER_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'venue', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'ticketPrice', type: 'uint256' },
      { name: 'maxTickets', type: 'uint256' },
    ],
    name: 'createEvent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'eventId', type: 'uint256' }],
    name: 'getEvent',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'venue', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'ticketPrice', type: 'uint256' },
      { name: 'maxTickets', type: 'uint256' },
      { name: 'soldTickets', type: 'uint256' },
      { name: 'organizer', type: 'address' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllEvents',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// TicketManager ABI (简化版)
const TICKET_MANAGER_ABI = [
  {
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
    ],
    name: 'mintTicket',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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
  const { data: eventIds, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.eventManager,
    abi: EVENT_MANAGER_ABI,
    functionName: 'getAllEvents',
  });

  // 获取每个事件的详细信息
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // 处理事件数据
  React.useEffect(() => {
    if (eventIds && eventIds.length > 0) {
      setEventsLoading(true);
      // 这里可以实现批量获取事件详情的逻辑
      // 暂时返回模拟数据
      const mockEvents: Event[] = [
        {
          id: BigInt(1),
          name: "区块链技术大会",
          description: "探讨区块链技术的最新发展趋势和应用场景",
          venue: "上海国际会议中心",
          startTime: new Date('2024-03-15T09:00:00'),
          endTime: new Date('2024-03-15T18:00:00'),
          ticketPrice: parseEther('0.1'),
          maxTickets: BigInt(500),
          soldTickets: BigInt(120),
          organizer: '0x1234567890123456789012345678901234567890',
          isActive: true,
        },
        {
          id: BigInt(2),
          name: "NFT 艺术展",
          description: "展示最新的NFT艺术作品和数字收藏品",
          venue: "北京艺术博物馆",
          startTime: new Date('2024-03-20T10:00:00'),
          endTime: new Date('2024-03-22T17:00:00'),
          ticketPrice: parseEther('0.05'),
          maxTickets: BigInt(200),
          soldTickets: BigInt(85),
          organizer: '0x2345678901234567890123456789012345678901',
          isActive: true,
        },
      ];
      setEvents(mockEvents);
      setEventsLoading(false);
    }
  }, [eventIds]);

  return {
    events,
    isLoading: isLoading || eventsLoading,
    error,
    refetch,
  };
}

// Hook: 获取单个活动
export function useGetEvent(eventId: string | undefined) {
  const { data: eventData, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.eventManager,
    abi: EVENT_MANAGER_ABI,
    functionName: 'getEvent',
    args: eventId ? [BigInt(eventId)] : undefined,
    query: {
      enabled: !!eventId,
    },
  });

  // 处理返回数据
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

  return {
    event,
    isLoading,
    error,
    refetch,
  };
}

// Hook: 创建活动
export function useCreateEvent() {
  const { address } = useWallet();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createEvent = async (eventData: {
    name: string;
    description: string;
    venue: string;
    startTime: Date;
    endTime: Date;
    ticketPrice: string;
    maxTickets: number;
  }) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    writeContract({
      address: CONTRACT_ADDRESSES.eventManager,
      abi: EVENT_MANAGER_ABI,
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
  };

  return {
    createEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook: 购买门票
export function useMintTicket() {
  const { address } = useWallet();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintTicket = async (eventId: string, quantity: number, ticketPrice: bigint) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    const totalPrice = ticketPrice * BigInt(quantity);

    writeContract({
      address: CONTRACT_ADDRESSES.ticketManager,
      abi: TICKET_MANAGER_ABI,
      functionName: 'mintTicket',
      args: [BigInt(eventId), BigInt(quantity)],
      value: totalPrice,
    });
  };

  return {
    mintTicket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook: 转让门票
export function useTransferTicket() {
  const { address } = useWallet();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transferTicket = async (to: string, tokenId: string) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    writeContract({
      address: CONTRACT_ADDRESSES.ticketManager,
      abi: TICKET_MANAGER_ABI,
      functionName: 'transferFrom',
      args: [address, to as `0x${string}`, BigInt(tokenId)],
    });
  };

  return {
    transferTicket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
