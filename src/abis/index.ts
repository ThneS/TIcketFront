// Central export for all contract ABIs and address helpers
// Real ABIs should be generated from the solidity source (e.g. foundry build artifacts)
// For now we define typed const assertions for tree-shaking and type safety.

import eventManager from './EventManager.json';
import ticketManager from './TicketManager.json';
import marketplace from './Marketplace.json';
import platformToken from './PlatformToken.json';
import tokenSwap from './TokenSwap.json';

export const ABIS = {
  eventManager: eventManager as const,
  ticketManager: ticketManager as const,
  marketplace: marketplace as const,
  platformToken: platformToken as const,
  tokenSwap: tokenSwap as const,
};

// Environment driven addresses (single-network fallback)
export const CONTRACT_ADDRESSES = {
  eventManager: import.meta.env.VITE_EVENT_MANAGER as `0x${string}` | undefined,
  ticketManager: import.meta.env.VITE_TICKET_MANAGER as `0x${string}` | undefined,
  marketplace: import.meta.env.VITE_MARKETPLACE as `0x${string}` | undefined,
  platformToken: import.meta.env.VITE_PLATFORM_TOKEN as `0x${string}` | undefined,
  tokenSwap: import.meta.env.VITE_TOKEN_SWAP as `0x${string}` | undefined,
} as const;

// Optional multi-network mapping (JSON in env)
// VITE_CONTRACTS_JSON example:
// {"31337":{"EVENT_MANAGER":"0x..."},"11155111":{"EVENT_MANAGER":"0x..."}}
export function getAddress(key: keyof typeof CONTRACT_ADDRESSES, chainId?: number): `0x${string}` | undefined {
  try {
    const mappingRaw = import.meta.env.VITE_CONTRACTS_JSON;
    if (chainId && mappingRaw) {
      const parsed = JSON.parse(mappingRaw);
      const networkConfig = parsed[String(chainId)];
      if (networkConfig) {
        const upper = key.toUpperCase();
        return networkConfig[upper] || networkConfig[key] || CONTRACT_ADDRESSES[key];
      }
    }
    return CONTRACT_ADDRESSES[key];
  } catch (e) {
    console.warn('Failed parsing VITE_CONTRACTS_JSON', e);
    return CONTRACT_ADDRESSES[key];
  }
}
