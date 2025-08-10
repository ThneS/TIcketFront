// Lightweight observability helpers

interface PerfSpan {
  label: string;
  start: number;
}

const enabled = ((): boolean => {
  if (typeof window === 'undefined') return false;
  // Enable via query ?debug=1 OR global flag
  if (window.location.search.includes('debug=1')) return true;
  // @ts-ignore
  return !!window.__APP_DEBUG__;
})();

export function startSpan(label: string): PerfSpan | null {
  if (!enabled) return null;
  return { label, start: performance.now() };
}

export function endSpan(span: PerfSpan | null) {
  if (!span || !enabled) return;
  const dur = performance.now() - span.start;
  // eslint-disable-next-line no-console
  console.info(`[perf] ${span.label} ${dur.toFixed(1)}ms`);
}

export function logInfo(...args: any[]) {
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.log('[app]', ...args);
}

export function logError(...args: any[]) {
  // Always log errors in dev, only when enabled in prod
  if (import.meta.env.DEV || enabled) {
    // eslint-disable-next-line no-console
    console.error('[app:error]', ...args);
  }
}
