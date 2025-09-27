# 数据源 Dev 面板 (Data Source Dev Panel)

本面板用于在开发环境实时可视化、调试与持久化演出数据源与字段级合并策略，无需修改环境变量或刷新页面。

## 1. 背景与目标

为实现“链上为真 + 后端增强”模式，我们引入可配置的数据源与 Hybrid 字段合并策略。Dev 面板提供：

- 快速切换 列表/详情 数据源 (contract/backend/hybrid)
- 动态编辑 mergePolicy（默认模式 + 字段级策略）
- 外部 dataConfig.json 热更新（轮询检测差异）
- localStorage 覆盖持久化、重置与导出

## 2. 配置优先级链

```
内置默认值 -> 单项 env (VITE_DATA_SOURCE_*) -> 外部 JSON (VITE_DATA_CONFIG_PATH) -> localStorage override (Dev 面板)
```

可在浏览器控制台查看：

```js
window.__DATA_SOURCE_CONFIG__; // 当前有效配置
localStorage.getItem("__DATA_SOURCE_CONFIG_OVERRIDE__");
```

## 3. 面板入口

开发模式 (import.meta.env.DEV) 下，右下角出现“数据源 ⚙”按钮；点击展开面板。生产默认不渲染，如需临时开启请自行修改构建条件或添加 `VITE_DATA_CONFIG_POLL_ENABLE`。

## 4. 功能说明

| 功能                | 描述                                                         | 影响持久化        |
| ------------------- | ------------------------------------------------------------ | ----------------- |
| 列表源 / 详情源切换 | 修改 `showsList` / `showDetail`                              | 是 (localStorage) |
| 默认合并模式        | 修改 `mergePolicy.defaultMode`                               | 是                |
| 字段级策略增删      | 在 list/detail 作用域下为指定字段添加/修改/清除合并模式      | 是                |
| 添加字段            | 直接写字段名 (如 `description`) 回车或点“添加”               | 是                |
| 清除字段策略        | 该字段回退到 defaultMode                                     | 是 (删除存储键)   |
| 复制当前 JSON       | 复制运行时最终配置（含 override）                            | 否                |
| 重置覆盖            | 清空 localStorage 覆盖，回到“外部 JSON + env”                | localStorage 清空 |
| 热更新轮询          | 定期抓取外部 JSON 并检测 diff；有变化时应用并再叠加 override | N/A               |

## 5. 外部 JSON 轮询

默认：开发模式每 5000ms 拉取一次。

可通过：

```
VITE_DATA_CONFIG_POLL_MS=8000
VITE_DATA_CONFIG_POLL_ENABLE=true   # 在非 DEV 环境启用
```

检测逻辑：序列化新 JSON 与上次缓存对比，不同则：

1. 应用外部 JSON -> 2. 重新套用 localStorage override -> 3. 通知订阅者(hooks 重算)

## 6. 合并模式语义

| 模式            | 行为                                              |
| --------------- | ------------------------------------------------- |
| preferContract  | 链上值优先；空(undefined/null/"") 则回落后端      |
| preferBackend   | 后端值优先；空则回落链上                          |
| coalesce (默认) | 若后端值存在(非 null/undefined)则用后端，否则链上 |

## 7. 常见调试路径

| 场景                         | 推荐操作                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| 验证后端描述覆盖列表         | showsList=hybrid，listFields.description=preferBackend                                          |
| 详情保留链上描述但地点走后端 | showDetail=hybrid，detailFields.location=preferBackend，detailFields.description=preferContract |
| 快速回退链上真实数据         | 清除对应字段策略或改 preferContract                                                             |
| 外部 JSON 调整频繁           | 提高 poll 间隔 (3000~5000) 并利用 override 临时试验                                             |

## 8. 字段维护策略建议

1. 只在确需覆盖时才为字段添加策略，避免噪音；
2. 对“稳定结构”字段（name / startTime）建议保持 preferContract；
3. 对“富文本/补充”字段（description/location/banner/extraMeta）可尝试 preferBackend；
4. 对新增字段，先以 coalesce 观察实际数据稳定性再决定偏向策略。

## 9. 与 Hooks 的交互

`useShowsData`, `useShowData` 内部使用 `getDataSourceConfig()` 并订阅配置变化（通过自定义订阅机制）。面板修改后：

- React Query 不自动 refetch 合约/后端；若需要可在面板增加“手动刷新”按钮（可扩展）。
- 当前实现中数据源类型变化会立即影响后续渲染；旧数据保留直到新数据获取完成。

## 10. 重置 & 导出

- “重置覆盖”：调用 `resetLocalOverride()` 清空 localStorage；外部 JSON 与 env 将重新生效。
- “复制当前 JSON”：便于将调试结果粘贴回 `public/config/dataConfig.json`（或部署到远端配置服务）。

## 11. 高级用法（代码接口）

```ts
import {
  getDataSourceConfig,
  setDataSourceConfigAndPersist,
  resetLocalOverride,
  exportCurrentConfig,
} from "@/config/dataSource";

// 动态修改并持久化
setDataSourceConfigAndPersist({ showsList: "backend" });

// 调整字段策略
const cfg = getDataSourceConfig();
setDataSourceConfigAndPersist({
  mergePolicy: {
    ...cfg.mergePolicy,
    detailFields: {
      ...(cfg.mergePolicy.detailFields || {}),
      description: "preferBackend",
    },
  },
});

// 导出当前快照
console.log(exportCurrentConfig());

// 清除覆盖
resetLocalOverride();
```

## 12. 未来可扩展想法

- Diff 视图：显示 外部 JSON vs override 差异
- 预设策略一键应用 (e.g. “链上优先”, “描述后端”, “后端完全替换”)
- 导出为 Patch（仅包含覆盖差异）
- WebSocket 推送替代轮询（后端配置中心）
- 权限控制：生产灰度调试仅管理员可见

## 13. 风险与注意

| 风险             | 说明                                  | 缓解措施                                    |
| ---------------- | ------------------------------------- | ------------------------------------------- |
| 覆盖长期遗忘     | localStorage 覆盖导致与团队配置不一致 | 面板内显眼“重置覆盖”按钮 + 文档说明         |
| 生产误开启       | Dev 面板暴露给终端用户                | 构建条件限制 + 单独开关变量                 |
| 外部 JSON 不可达 | 网络错误后使用旧配置                  | 失败静默，保留当前；可加 Toast 提示（未来） |

---

如需英文版本或进一步可视化（如字段来源颜色标注），可在 Issue / Roadmap 中提出。
