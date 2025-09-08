import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import { useCallback } from "react";

export type TxStatus =
  | "wallet"
  | "sent"
  | "confirming"
  | "success"
  | "failed"
  | "cancelled";

export interface TxItem {
  hash?: `0x${string}`;
  tempId: string; // used before hash known
  title: string;
  description?: string;
  chainId?: number;
  status: TxStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

interface TxQueueState {
  items: TxItem[];
  add: (item: Omit<TxItem, "createdAt" | "updatedAt">) => void;
  updateByTemp: (tempId: string, patch: Partial<TxItem>) => void;
  updateByHash: (hash: `0x${string}`, patch: Partial<TxItem>) => void;
  remove: (id: string | { hash: string }) => void;
  clearFinished: () => void;
}

export const useTxQueueStore = create<TxQueueState>()(
  devtools(
    subscribeWithSelector((set) => ({
      items: [],
      add: (item) =>
        set(
          (s) => ({
            items: [
              ...s.items,
              { ...item, createdAt: Date.now(), updatedAt: Date.now() },
            ],
          }),
          false,
          "tx/add"
        ),
      updateByTemp: (tempId, patch) =>
        set(
          (s) => ({
            items: s.items.map((i) =>
              i.tempId === tempId
                ? { ...i, ...patch, updatedAt: Date.now() }
                : i
            ),
          }),
          false,
          "tx/updateByTemp"
        ),
      updateByHash: (hash, patch) =>
        set(
          (s) => ({
            items: s.items.map((i) =>
              i.hash === hash ? { ...i, ...patch, updatedAt: Date.now() } : i
            ),
          }),
          false,
          "tx/updateByHash"
        ),
      remove: (id) =>
        set(
          (s) => ({
            items: s.items.filter(
              (i) =>
                i.tempId !== id &&
                i.hash !== (typeof id === "string" ? id : id.hash)
            ),
          }),
          false,
          "tx/remove"
        ),
      clearFinished: () =>
        set(
          (s) => ({
            items: s.items.filter(
              (i) => !["success", "failed", "cancelled"].includes(i.status)
            ),
          }),
          false,
          "tx/clearFinished"
        ),
    }))
  )
);

export function useTxQueue() {
  const { items, add, updateByTemp, updateByHash, remove, clearFinished } =
    useTxQueueStore();

  const trackWalletAction = useCallback(
    (params: { title: string; description?: string; chainId?: number }) => {
      const tempId = `wallet_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      add({
        tempId,
        title: params.title,
        description: params.description,
        chainId: params.chainId,
        status: "wallet",
      });
      return tempId;
    },
    [add]
  );

  const markSent = useCallback(
    (tempId: string, hash: `0x${string}`) => {
      updateByTemp(tempId, { hash, status: "sent" });
    },
    [updateByTemp]
  );

  const markConfirming = useCallback(
    (hash: `0x${string}`) => {
      updateByHash(hash, { status: "confirming" });
    },
    [updateByHash]
  );

  const markSuccess = useCallback(
    (hash: `0x${string}`) => {
      updateByHash(hash, { status: "success" });
    },
    [updateByHash]
  );

  const markFailed = useCallback(
    (hash: `0x${string}`, error?: string) => {
      updateByHash(hash, { status: "failed", error });
    },
    [updateByHash]
  );

  const markCancelled = useCallback(
    (tempId: string) => {
      updateByTemp(tempId, { status: "cancelled" });
    },
    [updateByTemp]
  );

  return {
    items,
    trackWalletAction,
    markSent,
    markConfirming,
    markSuccess,
    markFailed,
    markCancelled,
    remove,
    clearFinished,
  };
}

export function getExplorerTxUrl(
  chainId: number | undefined,
  hash: string | undefined
) {
  if (!chainId || !hash) return undefined;
  const base =
    chainId === 1
      ? import.meta.env.VITE_EXPLORER_MAINNET || "https://etherscan.io"
      : chainId === 11155111
      ? import.meta.env.VITE_EXPLORER_SEPOLIA || "https://sepolia.etherscan.io"
      : chainId === 31337
      ? import.meta.env.VITE_EXPLORER_ANVIL || ""
      : "";
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}
