import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

// 自定义 Anvil 链配置
export const anvil = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "http://localhost:3000" },
  },
} as const;

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as
  | string
  | undefined;

// 若未提供 WalletConnect 项目 ID，则回退到仅 Injected 钱包，避免 Reown Allowlist 报错
export const config = projectId
  ? getDefaultConfig({
      appName: "OnlineTicket DApp",
      projectId,
      chains: [anvil, sepolia, mainnet],
      ssr: false,
    })
  : createConfig({
      chains: [anvil, sepolia, mainnet],
      connectors: [injected()],
      transports: {
        [anvil.id]: http(anvil.rpcUrls.default.http[0]),
        [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
        [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
      },
      ssr: false,
    });
