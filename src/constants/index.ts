// 合约地址
export const CONTRACT_ADDRESSES = {
  PLATFORM_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TICKET_MANAGER: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  EVENT_MANAGER: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  TOKEN_SWAP: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  MARKETPLACE: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
} as const;

// 网络配置
export const CHAINS = {
  ANVIL: {
    id: 31337,
    name: 'Anvil',
    rpcUrl: 'http://127.0.0.1:8545',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
  },
} as const;

// API 端点
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  EVENTS: '/api/events',
  TICKETS: '/api/tickets',
  MARKETPLACE: '/api/marketplace',
  TOKEN_SWAP: '/api/token-swap',
  SHOWS: '/show',
} as const;

// 应用配置
export const APP_CONFIG = {
  NAME: 'OnlineTicket',
  DESCRIPTION: '基于区块链的去中心化门票管理平台',
  VERSION: '1.0.0',
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],
  DEFAULT_LANGUAGE: 'zh-CN',
} as const;

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;
