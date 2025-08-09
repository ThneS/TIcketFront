import type { Address } from 'viem';

// 基础类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户类型
export interface User {
  address: Address;
  ensName?: string;
  avatar?: string;
  isOrganizer: boolean;
  createdEvents: string[];
  ownedTickets: string[];
}

// 活动类型
export interface Event extends BaseEntity {
  name: string;
  description: string;
  imageUrl: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  organizer: Address;
  totalSupply: number;
  currentSupply: number;
  basePrice: bigint;
  isActive: boolean;
  ticketTypes: TicketType[];
}

// 门票类型
export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: bigint;
  maxSupply: number;
  currentSupply: number;
  saleStartTime: Date;
  saleEndTime: Date;
}

// 门票 NFT
export interface Ticket extends BaseEntity {
  tokenId: string;
  eventId: string;
  owner: Address;
  ticketType: TicketType;
  isUsed: boolean;
  usedAt?: Date;
  metadataUri: string;
  price: bigint;
}

// 市场订单
export interface MarketOrder extends BaseEntity {
  orderId: string;
  tokenId: string;
  seller: Address;
  price: bigint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 交易历史
export interface Transaction extends BaseEntity {
  hash: string;
  from: Address;
  to: Address;
  tokenId?: string;
  amount: bigint;
  type: 'mint' | 'transfer' | 'sale' | 'swap';
  gasUsed: bigint;
  gasPrice: bigint;
  status: 'pending' | 'confirmed' | 'failed';
}

// 代币余额
export interface TokenBalance {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
}

// 流动性池信息
export interface LiquidityPool {
  tokenA: TokenBalance;
  tokenB: TokenBalance;
  reserveA: bigint;
  reserveB: bigint;
  lpTokenBalance: bigint;
  share: number;
}

// 交换参数
export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  deadline: bigint;
  to: Address;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 表单类型
export interface CreateEventForm {
  name: string;
  description: string;
  imageUrl: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  ticketTypes: Omit<TicketType, 'id' | 'currentSupply'>[];
}

export interface BuyTicketForm {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
}

export interface CreateMarketOrderForm {
  tokenId: string;
  price: bigint;
}

export interface SwapForm {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  slippage: number;
}

// 钱包状态
export interface WalletState {
  isConnected: boolean;
  address?: Address;
  ensName?: string;
  chainId?: number;
  balance?: bigint;
}

// 应用状态
export interface AppState {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  wallet: WalletState;
  loading: boolean;
  error?: string;
}

// 路由类型
export interface Route {
  path: string;
  name: string;
  component: React.ComponentType;
  icon?: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}
