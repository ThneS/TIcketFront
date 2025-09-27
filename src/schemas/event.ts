import { z } from "zod";

// 简单 CID 校验（支持 Qm 开头的 CIDv0 与 bafy 开头的 CIDv1，可选 ipfs:// 前缀，允许后续追加路径如 /metadata.json）
// 说明：这是一个近似校验，不能 100% 覆盖所有多编码场景，但能过滤掉明显错误（如 "ssss"）。
const CID_REGEX =
  /^(ipfs:\/\/)?((Qm[1-9A-HJ-NP-Za-km-z]{44})|(bafy[0-9a-z]{20,}))(\/[\w\-./]+)?$/;

// Show creation schema (single ticket type MVP)
export const createShowSchema = z.object({
  name: z.string().min(2, "名称至少 2 个字符").max(64, "名称过长"),
  description: z.string().min(10, "描述至少 10 个字符").max(2000, "描述过长"),
  startTime: z.date({ required_error: "请选择开始时间" }),
  endTime: z.date({ required_error: "请选择结束时间" }),
  location: z.string().min(2, "请输入地点").max(128, "地点过长"),
  totalTickets: z
    .number()
    .int()
    .positive("数量必须为正整数")
    .max(100000, "数量过大"),
  ticketPrice: z.string().regex(/^\d+(\.\d{1,6})?$/, "价格格式不正确"),

  ipfs_cid: z
    .string()
    .min(2, "请输入 IPFS CID")
    .max(200, "IPFS CID 过长")
    .regex(
      CID_REGEX,
      "请输入有效 IPFS CID（例如 Qm... 或 bafy...，可选 ipfs:// 前缀，可带 /metadata.json）"
    ),
});

export type CreateShowInput = z.infer<typeof createShowSchema>;

export function validateShowChronology(data: CreateShowInput) {
  if (data.endTime <= data.startTime) {
    return "结束时间必须晚于开始时间";
  }
}
