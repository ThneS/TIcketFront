// Time formatting utilities (centralized)
export function formatDate(date: Date | number | string, opts?: Intl.DateTimeFormatOptions) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('zh-CN', opts);
}

export function formatDateTime(date: Date | number | string) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatRelative(from: Date | number, to: Date | number = Date.now()) {
  const f = from instanceof Date ? from.getTime() : +from;
  const t = to instanceof Date ? to.getTime() : +to;
  const diff = t - f; // ms
  const abs = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;
  const sec = abs / 1000;
  if (sec < 60) return sign < 0 ? `还有 ${Math.round(60 - sec)} 秒` : `${Math.round(sec)} 秒前`;
  const min = sec / 60;
  if (min < 60) return sign < 0 ? `还有 ${Math.round(60 - min)} 分钟` : `${Math.round(min)} 分钟前`;
  const hr = min / 60;
  if (hr < 24) return sign < 0 ? `还有 ${Math.round(24 - hr)} 小时` : `${Math.round(hr)} 小时前`;
  const day = hr / 24;
  return sign < 0 ? `还有 ${Math.round(day)} 天` : `${Math.round(day)} 天前`;
}
