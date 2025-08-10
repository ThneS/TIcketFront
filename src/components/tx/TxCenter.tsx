import React from 'react';
import { useTxQueue, getExplorerTxUrl } from '../../lib/txQueue';
import { useAccount } from 'wagmi';

const statusLabel: Record<string, string> = {
  wallet: '等待签名',
  sent: '已发送',
  confirming: '确认中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
};

export function TxCenter() {
  const { items, clearFinished, remove } = useTxQueue();
  const { chain } = useAccount();

  if (!items.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">暂无交易</div>
    );
  }

  return (
    <div className="space-y-2 p-2 max-h-96 overflow-y-auto w-72">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium">交易中心</h3>
        <button onClick={() => clearFinished()} className="text-xs text-blue-600 hover:underline">清理已完成</button>
      </div>
      {items.slice().reverse().map(item => {
        const url = getExplorerTxUrl(item.chainId ?? chain?.id, item.hash);
        return (
          <div key={item.hash || item.tempId} className="border rounded p-2 bg-white/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{item.title}</span>
              <span className={`text-[10px] px-1 rounded bg-gray-100 dark:bg-slate-700 ${item.status === 'failed' ? 'text-red-600' : item.status === 'success' ? 'text-green-600' : 'text-gray-500'}`}>{statusLabel[item.status]}</span>
            </div>
            {item.description && <div className="text-xs mt-1 line-clamp-2 text-gray-600 dark:text-gray-300">{item.description}</div>}
            <div className="flex items-center justify-between mt-1">
              {url && <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">区块浏览器</a>}
              <button onClick={() => remove(item.hash || item.tempId)} className="text-[10px] text-gray-400 hover:text-gray-600">移除</button>
            </div>
            {item.error && <div className="text-[10px] text-red-600 mt-1">{item.error}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function TxCenterDropdown() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="text-sm border rounded px-2 py-1 hover:bg-gray-50 dark:hover:bg-slate-700">交易</button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 shadow-lg border bg-white dark:bg-slate-800 rounded">
          <TxCenter />
        </div>
      )}
    </div>
  );
}
