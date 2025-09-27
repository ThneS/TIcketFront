import { useEffect, useState } from "react";
import {
  getDataSourceConfig,
  subscribeDataSourceConfig,
} from "../config/dataSource";
import type { DataSourceConfig } from "../config/dataSource";

/**
 * React 订阅版数据源配置 Hook：当 Dev 面板切换来源或合并策略时触发重渲染。
 */
export function useDataSourceConfig(): DataSourceConfig {
  const [cfg, setCfg] = useState(() => getDataSourceConfig());
  useEffect(() => {
    const unsub = subscribeDataSourceConfig((c) => setCfg({ ...c }));
    return () => {
      unsub();
    };
  }, []);
  return cfg;
}
