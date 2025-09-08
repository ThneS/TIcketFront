import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { useEffect as useTxEffect } from "react";
import { useTxQueueStore, getExplorerTxUrl } from "../../lib/txQueue";
import { useAccount } from "wagmi";

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  type?: "info" | "success" | "error" | "warning";
  duration?: number; // ms
  action?: { label: string; onClick: () => void };
}

export interface Toast extends Required<Omit<ToastOptions, "action">> {
  action?: ToastOptions["action"];
}

interface ToastContextValue {
  push: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_STYLES: Record<Toast["type"], string> = {
  info: "border-blue-300 bg-white",
  success: "border-green-300 bg-white",
  error: "border-red-300 bg-white",
  warning: "border-yellow-300 bg-white",
};

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const push = useCallback((opts: ToastOptions) => {
    const id = opts.id || `t_${Date.now()}_${toastIdCounter++}`;
    setToasts((prev) => {
      const next: Toast = {
        id,
        title: opts.title || "",
        description: opts.description || "",
        type: opts.type || "info",
        duration: opts.duration ?? 4000,
        action: opts.action,
      };
      const idx = prev.findIndex((t) => t.id === id);
      if (idx >= 0) {
        // 覆盖同 ID 的提示，避免重复
        const copy = prev.slice();
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.duration <= 0) return undefined;
      return setTimeout(() => dismiss(t.id), t.duration);
    });
    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [toasts, dismiss]);

  if (!containerRef.current && typeof document !== "undefined") {
    const div = document.createElement("div");
    div.id = "toast-root";
    document.body.appendChild(div);
    containerRef.current = div;
  }

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {containerRef.current &&
        createPortal(
          <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50 w-80">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`border rounded shadow-sm p-4 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 ${
                  TYPE_STYLES[t.type]
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    {t.title && (
                      <div className="font-medium text-sm mb-1">{t.title}</div>
                    )}
                    {t.description && (
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                {t.action && (
                  <button
                    className="mt-3 text-xs font-medium text-blue-600 hover:underline"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-transparent animate-[shrink_linear]" />
              </div>
            ))}
          </div>,
          containerRef.current
        )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function TxToastBridge() {
  const { chain } = useAccount();
  const { push } = useToast();
  const items = useTxQueueStore((s) => s.items);
  const lastStatusRef = React.useRef<
    Map<string, import("../../lib/txQueue").TxStatus>
  >(new Map());
  useTxEffect(() => {
    items.forEach((item) => {
      // 以 tx hash 作为稳定 ID（若无 hash，退回 title）；
      // 为避免同一次提交先无 hash 再有 hash 造成两条提示，
      // 对于 'sent' 阶段，若暂未有 hash，则暂不提示，等有 hash 再提示。
      if (item.status === "sent" && !item.hash) return;
      const id = (item.hash ?? item.title) as string;

      // 若同一 id 的相同状态已推送过，则跳过，避免重复渲染引发的循环
      const last = lastStatusRef.current.get(id);
      if (last === item.status) return;
      lastStatusRef.current.set(id, item.status);

      if (item.status === "sent") {
        push({
          id,
          type: "info",
          title: item.title,
          description: "交易已发送，等待确认",
        });
      } else if (item.status === "confirming") {
        push({
          id,
          type: "info",
          title: item.title,
          description: "区块确认中...",
        });
      } else if (item.status === "success") {
        const url = getExplorerTxUrl(chain?.id, item.hash);
        push({
          id,
          type: "success",
          title: item.title,
          description: url
            ? `成功 · 查看交易: ${item.hash?.slice(0, 10)}...`
            : "成功",
        });
      } else if (item.status === "failed") {
        push({
          id,
          type: "error",
          title: item.title,
          description: item.error || "交易失败",
        });
      } else if (item.status === "cancelled") {
        push({ id, type: "warning", title: item.title, description: "已取消" });
      }
    });
  }, [items, push, chain?.id]);

  return null;
}
