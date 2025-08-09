import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

// 自定义 Anvil 链配置
export const anvil = {
  id: 31337,
  name: 'Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'http://localhost:3000' },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'OnlineTicket DApp',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '2c4c28de6b04c748986ea1bb0c1e1e02',
  chains: [anvil, sepolia, mainnet],
  ssr: false, // 如果您的 dApp 不使用服务器端渲染，请添加此行
});
