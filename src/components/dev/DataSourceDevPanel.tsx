import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getDataSourceConfig,
  subscribeDataSourceConfig,
  setDataSourceConfigAndPersist,
  resetLocalOverride,
  exportCurrentConfig,
} from "../../config/dataSource";
import {
  getApiBaseUrl,
  setRuntimeApiBase,
  getRuntimeApiBase,
} from "../../api/request";

interface EditableFieldRowProps {
  field: string;
  scope: "list" | "detail";
  value?: string;
  onChange: (mode: string | undefined) => void;
}

const MERGE_MODES = ["preferContract", "preferBackend", "coalesce"] as const;

const FieldRow: React.FC<EditableFieldRowProps> = ({
  field,
  scope,
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 font-mono truncate" title={`${scope}.${field}`}>
        {scope}.{field}
      </span>
      <select
        className="border rounded px-1 py-0.5 bg-white"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">(default)</option>
        {MERGE_MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <button
        className="text-red-500 hover:underline"
        onClick={() => onChange(undefined)}
      >
        清除
      </button>
    </div>
  );
};

export const DataSourceDevPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(() => getDataSourceConfig());
  const [newField, setNewField] = useState("");
  const [scope, setScope] = useState<"list" | "detail">("list");
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = subscribeDataSourceConfig((c) => setCfg({ ...c }));
    return () => {
      unsub();
    };
  }, []);

  const updateDataSources = (k: "showsList" | "showDetail", v: string) => {
    setDataSourceConfigAndPersist({ [k]: v } as any);
  };
  const updateDefaultMode = (mode: string) => {
    setDataSourceConfigAndPersist({
      mergePolicy: { ...cfg.mergePolicy, defaultMode: mode as any },
    });
  };
  const updateFieldMode = (
    scope: "list" | "detail",
    field: string,
    mode?: string
  ) => {
    const mp = cfg.mergePolicy;
    const key = scope === "list" ? "listFields" : "detailFields";
    const current = { ...(mp as any)[key] };
    if (!mode) delete current[field];
    else current[field] = mode;
    setDataSourceConfigAndPersist({ mergePolicy: { ...mp, [key]: current } });
  };
  const addField = () => {
    const f = newField.trim();
    if (!f) return;
    updateFieldMode(scope, f, "coalesce");
    setNewField("");
  };
  const handleReset = () => {
    resetLocalOverride();
  };
  const handleCopy = () => {
    const json = JSON.stringify(exportCurrentConfig(), null, 2);
    navigator.clipboard.writeText(json).catch(() => {});
  };
  const apiBase = getApiBaseUrl();
  const runtimeBase = getRuntimeApiBase();
  const [baseInput, setBaseInput] = useState(runtimeBase || apiBase || "");
  const backendMissing = !apiBase && !runtimeBase;
  const handleRefetch = () => {
    // 统一刷新：合约相关 + 后端相关 keys
    // 合约列表/详情 keys: 由于 useReadContract 内部管理，直接调用 invalidateQueries 较难精准匹配，采用 refetchQueries 的 key 前缀策略（如果后续封装了 queryKey 可统一）
    // 后端： ["backend","shows"], ["backend","show"]
    try {
      qc.invalidateQueries({
        predicate: (q) => {
          const k: any = q.queryKey;
          if (!Array.isArray(k)) return false;
          if (k[0] === "backend") return true;
          // viem readContract queries 可能包含对象结构，这里简单匹配包含 functionName
          if (
            k.some(
              (p) => typeof p === "object" && p?.functionName === "getShows"
            )
          )
            return true;
          if (
            k.some(
              (p) => typeof p === "object" && p?.functionName === "getShow"
            )
          )
            return true;
          return false;
        },
      });
    } catch (e) {
      // ignore
    }
  };

  if (!import.meta.env.DEV) return null; // 仅开发环境显示

  return (
    <div className="fixed z-50 bottom-4 right-4 text-[12px] font-sans">
      {!open && (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          数据源⚙
        </button>
      )}
      {open && (
        <div className="w-[380px] max-h-[80vh] overflow-auto bg-white border shadow-xl rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Data Source Dev Panel</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {backendMissing &&
              (cfg.showsList === "backend" ||
                cfg.showDetail === "backend" ||
                cfg.showsList === "hybrid" ||
                cfg.showDetail === "hybrid") && (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded text-[11px] leading-snug">
                  后端数据源已选择但{" "}
                  <span className="font-mono">VITE_API_BASE_URL</span>{" "}
                  未配置，实际不会发送请求。
                </div>
              )}
            <div className="border rounded p-2 bg-gray-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">
                  API Base Override
                </span>
                <span className="text-[10px] text-gray-400">
                  来源: {runtimeBase ? "override" : apiBase ? "env" : "none"}
                </span>
              </div>
              <input
                className="w-full border rounded px-2 py-1 text-xs font-mono"
                placeholder="http://127.0.0.1:3000"
                value={baseInput}
                onChange={(e) => setBaseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setRuntimeApiBase(baseInput || undefined);
                    handleRefetch();
                  }
                }}
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]"
                  onClick={() => {
                    setRuntimeApiBase(baseInput || undefined);
                    handleRefetch();
                  }}
                >
                  应用并刷新
                </button>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-[11px]"
                  onClick={() => {
                    setBaseInput("");
                    setRuntimeApiBase(undefined);
                    handleRefetch();
                  }}
                >
                  清除覆盖
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">列表源</label>
              <select
                value={cfg.showsList}
                onChange={(e) => updateDataSources("showsList", e.target.value)}
                className="border rounded px-1 py-0.5"
              >
                <option value="contract">contract</option>
                <option value="backend">backend</option>
                <option value="hybrid">hybrid</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">详情源</label>
              <select
                value={cfg.showDetail}
                onChange={(e) =>
                  updateDataSources("showDetail", e.target.value)
                }
                className="border rounded px-1 py-0.5"
              >
                <option value="contract">contract</option>
                <option value="backend">backend</option>
                <option value="hybrid">hybrid</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">默认合并</label>
              <select
                value={cfg.mergePolicy.defaultMode || "coalesce"}
                onChange={(e) => updateDefaultMode(e.target.value)}
                className="border rounded px-1 py-0.5"
              >
                {MERGE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold mb-1">字段级策略</p>
            <div className="grid grid-cols-1 gap-1 mb-2">
              {Object.entries(cfg.mergePolicy.listFields || {}).map(
                ([f, m]) => (
                  <FieldRow
                    key={"list-" + f}
                    field={f}
                    scope="list"
                    value={m as any}
                    onChange={(mode) => updateFieldMode("list", f, mode)}
                  />
                )
              )}
              {Object.entries(cfg.mergePolicy.detailFields || {}).map(
                ([f, m]) => (
                  <FieldRow
                    key={"detail-" + f}
                    field={f}
                    scope="detail"
                    value={m as any}
                    onChange={(mode) => updateFieldMode("detail", f, mode)}
                  />
                )
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="border rounded px-1 py-0.5"
              >
                <option value="list">list</option>
                <option value="detail">detail</option>
              </select>
              <input
                className="border rounded px-1 py-0.5 flex-1"
                placeholder="字段名 (e.g. description)"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addField();
                  }
                }}
              />
              <button
                onClick={addField}
                className="bg-gray-200 hover:bg-gray-300 rounded px-2 py-0.5"
              >
                添加
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <button
              onClick={handleReset}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              重置覆盖
            </button>
            <button
              onClick={handleCopy}
              className="bg-gray-800 text-white px-2 py-1 rounded hover:bg-black"
            >
              复制当前 JSON
            </button>
            <button
              onClick={handleRefetch}
              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              title="强制失效并重新抓取合约与后端列表/详情缓存"
            >
              强制刷新
            </button>
            <span className="text-[10px] text-gray-400 ml-auto">
              localStorage 持久化
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
