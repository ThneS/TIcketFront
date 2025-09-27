// 统一将后端返回的 Show 对象（BackendShow）转换为合约风格 ContractLikeShow
// BackendShow: 结构较自由，字段可能为字符串/数字/Date 混合
// ContractLikeShow: 对齐链上 hooks(useGetShow / useGetAllShows) 的 Show 字段

export interface ContractLikeShow {
  id: string; // 使用字符串形式（链上为 bigint.toString()）
  name: string;
  description: string;
  location: string;
  startTime: Date;
  ticketPrice: bigint;
  maxTickets: bigint;
  soldTickets: bigint;
  organizer: string;
  isActive: boolean;
  status: number; // 枚举数值
  metadataURI: string; // 可能为空字符串
  // 保留原始后端对象引用
  _backend?: any;
}

export type BackendShow = any; // 后端自由结构，这里不强约束。

function toBigint(v: any, fallback: bigint = 0n): bigint {
  try {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(Math.floor(v));
    if (typeof v === "string" && v.trim() !== "") return BigInt(v);
  } catch {}
  return fallback;
}

function toDate(raw: any): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw * 1000); // 假设秒
  if (typeof raw === "string") {
    if (/^\d+$/.test(raw)) return new Date(Number(raw) * 1000);
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function normalizeShowFromBackend(
  show: BackendShow | undefined | null
): ContractLikeShow | undefined {
  if (!show || typeof show !== "object") return undefined;
  const name = (show as any).name || "(未命名)";
  const description = (show as any).description || "";
  const location = (show as any).location || (show as any).venue || "-";
  const startTime = toDate((show as any).startTime || (show as any).eventTime);
  const ticketPrice = toBigint(
    (show as any).ticketPrice || (show as any).price
  );
  const maxTickets = toBigint(
    (show as any).maxTickets || (show as any).totalTickets
  );
  const soldTickets = toBigint(
    (show as any).soldTickets || (show as any).ticketsSold
  );
  const organizer =
    (show as any).organizer ||
    (show as any).owner ||
    "0x0000000000000000000000000000000000000000";
  const isActive = (() => {
    const v = (show as any).isActive;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
    return true;
  })();
  const status = (show as any).status ?? (isActive ? 1 : 0);
  const metadataURI =
    (show as any).metadataURI ||
    (show as any).metadata_uri ||
    (show as any).ipfs ||
    (show as any)?.meta?.uri ||
    "";
  return {
    id: (show as any).id?.toString?.() || (show as any).id || "0",
    name,
    description,
    location,
    startTime,
    ticketPrice,
    maxTickets,
    soldTickets,
    organizer,
    isActive,
    status: typeof status === "number" ? status : Number(status) || 0,
    metadataURI,
    _backend: show,
  };
}
