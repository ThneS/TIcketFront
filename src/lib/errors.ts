// Standardized error mapping utilities
// Categories: userRejected | contractRevert | network | parse | unknown

export type AppErrorCategory = 'userRejected' | 'contractRevert' | 'network' | 'parse' | 'unknown';

export interface AppErrorShape {
  category: AppErrorCategory;
  message: string;         // user friendly message (ZH now, i18n later)
  rawMessage?: string;     // original error message
  code?: string | number;  // optional code
  data?: any;              // extra data
}

const MATCHERS: { cat: AppErrorCategory; regex: RegExp; friendly: string }[] = [
  { cat: 'userRejected', regex: /user rejected|denied|拒绝/i, friendly: '用户已拒绝签名' },
  { cat: 'contractRevert', regex: /revert|execution reverted|insufficient/i, friendly: '合约执行回退' },
  { cat: 'network', regex: /network|timeout|503|504|ECONN|ENOTFOUND/i, friendly: '网络异常，请稍后重试' },
  { cat: 'parse', regex: /invalid json|unexpected token|parse/i, friendly: '数据解析错误' },
];

export function mapError(err: any): AppErrorShape {
  if (!err) return { category: 'unknown', message: '未知错误', rawMessage: '' };
  const raw = err?.shortMessage || err?.message || String(err);
  for (const m of MATCHERS) {
    if (m.regex.test(raw)) {
      return { category: m.cat, message: m.friendly, rawMessage: raw };
    }
  }
  return { category: 'unknown', message: '发生错误', rawMessage: raw };
}

export function extractFriendlyMessage(err: any) {
  return mapError(err).message;
}
