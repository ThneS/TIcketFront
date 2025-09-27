// IPFS 工具：通过环境变量配置默认网关
// 支持：
//  - 传入形如 ipfs://CID/path 或 纯 CID 或 CID/path
//  - 可在 .env.[mode] 中设置 VITE_IPFS_GATEWAY，例如：
//      VITE_IPFS_GATEWAY=https://w3s.link/ipfs/
//      VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
// 若未配置则回退 ipfs.io 网关。

const RAW_GATEWAY = (import.meta as any).env?.VITE_IPFS_GATEWAY as
  | string
  | undefined;

// 规范化：确保末尾带 /ipfs/ 或最后是 /
function normalizeGateway(gw?: string): string {
  if (!gw) return "https://ipfs.io/ipfs/";
  let g = gw.trim();
  if (!g) return "https://ipfs.io/ipfs/";
  // 若已包含 /ipfs/ 末尾无 / 则补 /
  if (g.endsWith("/")) {
    // ok
  } else {
    g += "/";
  }
  // 如果不含 /ipfs/ 且看起来像通用根域，则补上 ipfs/ 方便直接拼 CID
  if (!g.includes("/ipfs/")) {
    if (!g.endsWith("ipfs/")) g += "ipfs/";
  }
  return g;
}

const GATEWAY = normalizeGateway(RAW_GATEWAY);

export function buildIpfsHttpUrl(input: string): string {
  if (!input) return "";
  let v = input.trim();
  if (v.startsWith("ipfs://")) v = v.replace(/^ipfs:\/\//, "");
  // 现在 v 可能是 CID 或 CID/path
  return GATEWAY + v;
}

export function getActiveIpfsGateway() {
  return GATEWAY;
}
