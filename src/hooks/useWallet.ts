import { useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import type { Address } from 'viem';

// 钱包连接状态类型
export interface WalletState {
  // 连接状态
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;

  // 账户信息
  address?: Address;
  ensName?: string;
  ensAvatar?: string;

  // 余额信息
  balance?: {
    value: bigint;
    formatted: string;
    symbol: string;
    decimals: number;
  };

  // 链信息
  chainId?: number;
  chain?: {
    id: number;
    name: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };

  // 错误状态
  error?: Error;
}

// 钱包操作接口
export interface WalletActions {
  connect: () => void;
  disconnect: () => void;
  refetchBalance: () => void;
}

// useWallet hook 的返回类型
export interface UseWalletReturn extends WalletState, WalletActions {}

/**
 * 钱包管理 Hook
 * 提供钱包连接、断开连接、账户信息获取等功能
 */
export function useWallet(): UseWalletReturn {
  // 账户相关 hooks
  const {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    chain
  } = useAccount();

  // 连接和断开连接
  const { error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  // ENS 信息
  const { data: ensName } = useEnsName({
    address,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
  });

  // 余额信息
  const {
    data: balanceData,
    error: balanceError,
    refetch: refetchBalance
  } = useBalance({
    address,
  });

  // 处理连接
  const handleConnect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  // 处理断开连接
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // 格式化余额
  const formatBalance = useCallback(() => {
    if (!balanceData) return undefined;

    return {
      value: balanceData.value,
      formatted: balanceData.formatted,
      symbol: balanceData.symbol,
      decimals: balanceData.decimals,
    };
  }, [balanceData]);

  // 监听账户变化
  useEffect(() => {
    if (address && isConnected) {
      console.log('Wallet connected:', address);
    }
  }, [address, isConnected]);

  // 监听链变化
  useEffect(() => {
    if (chain) {
      console.log('Chain changed:', chain.name, chain.id);
    }
  }, [chain]);

  // 合并错误
  const error = connectError || balanceError;

  return {
    // 状态
    isConnected,
    isConnecting,
    isReconnecting,
    address,
    ensName: ensName || undefined,
    ensAvatar: ensAvatar || undefined,
    balance: formatBalance(),
    chainId: chain?.id,
    chain: chain ? {
      id: chain.id,
      name: chain.name,
      nativeCurrency: {
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol,
        decimals: chain.nativeCurrency.decimals,
      },
    } : undefined,
    error: error || undefined,

    // 操作
    connect: handleConnect,
    disconnect: handleDisconnect,
    refetchBalance,
  };
}

// 便捷的钱包状态检查 hooks
export function useIsWalletConnected(): boolean {
  const { isConnected } = useWallet();
  return isConnected;
}

export function useWalletAddress(): Address | undefined {
  const { address } = useWallet();
  return address;
}

export function useWalletBalance() {
  const { balance, refetchBalance } = useWallet();
  return { balance, refetch: refetchBalance };
}

export function useWalletChain() {
  const { chain, chainId } = useWallet();
  return { chain, chainId };
}

// 检查是否为指定地址的 hook
export function useIsAddress(targetAddress?: Address): boolean {
  const { address } = useWallet();
  return !!(address && targetAddress && address.toLowerCase() === targetAddress.toLowerCase());
}

// 格式化地址显示
export function useFormattedAddress(address?: Address, length: number = 6): string {
  if (!address) return '';

  if (address.length <= length * 2) return address;

  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

// 使用 ENS 名称或格式化地址
export function useDisplayName(address?: Address): string {
  const { ensName } = useWallet();
  const formattedAddress = useFormattedAddress(address);

  if (address && address === useWalletAddress()) {
    return ensName || formattedAddress;
  }

  return useFormattedAddress(address);
}
