// 全局应用配置 & 运行时可调开关
// API 错误 Toast 开关：默认开启，支持通过环境变量和运行时函数关闭/启用
// 环境变量：VITE_API_ERROR_TOAST
//   off / 0 / false  -> 关闭
//   其他或未配置     -> 开启

let apiErrorToastEnabled: boolean = (() => {
  const raw = (import.meta as any)?.env?.VITE_API_ERROR_TOAST as
    | string
    | undefined;
  if (!raw) return true;
  const v = raw.toLowerCase();
  return !(v === "off" || v === "0" || v === "false");
})();

export function isApiErrorToastEnabled(): boolean {
  return apiErrorToastEnabled;
}

export function setApiErrorToastEnabled(enabled: boolean) {
  apiErrorToastEnabled = enabled;
  if (typeof window !== "undefined") {
    // 可选：暴露到 window 方便在浏览器控制台动态调试
    (window as any).__API_ERROR_TOAST__ = enabled;
  }
}

// 初始化时附加到 window 方便观察当前状态（非必须，可移除）
if (typeof window !== "undefined") {
  (window as any).__API_ERROR_TOAST__ = apiErrorToastEnabled;
}
