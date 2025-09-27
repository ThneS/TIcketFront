# OnlineTicket Frontend

基于 React + TypeScript + Vite 构建的 Web3 票务平台前端应用。

## 技术栈

- **框架**: React 18.2 + TypeScript 5.8
- **构建工具**: Vite
- **Web3**: Wagmi + Viem + RainbowKit
- **样式**: TailwindCSS + shadcn/ui
- **状态管理**: Zustand
- **路由**: React Router DOM
- **表单**: React Hook Form + Zod
- **数据**: TanStack Query（分资源 staleTime 策略）
- **通知 / 交易**: 自研 ToastProvider + txQueue 状态机
- **测试**: Vitest + jsdom（基础用例）
- **国际化**: 轻量 i18nProvider (zh/en 可扩展)

## 环境变量

| 变量                          | 描述                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| VITE_EVENT_MANAGER            | EventManager 合约地址                                              |
| VITE_TICKET_MANAGER           | TicketManager 合约地址                                             |
| VITE_MARKETPLACE              | Marketplace 合约地址                                               |
| VITE_PLATFORM_TOKEN           | 平台 Token 地址                                                    |
| VITE_TOKEN_SWAP               | TokenSwap 合约地址                                                 |
| VITE_API_BASE_URL             | 后端 API 基础 URL (e.g. http://localhost:3001)                     |
| VITE_CONTRACTS_JSON           | 多网络 JSON 映射 (e.g. {"11155111": {"EVENT_MANAGER": "0x..."}} )  |
| VITE_API_ERROR_TOAST          | 控制是否显示后端 API 错误 Toast ("off"/"0"/"false" 关闭，默认开启) |
| VITE_DATA_SOURCE_SHOWS_LIST   | Shows 列表数据源: contract/backend/hybrid (默认 contract)          |
| VITE_DATA_SOURCE_SHOW_DETAIL  | Show 详情数据源: contract/backend/hybrid (默认 contract)           |
| VITE_DATA_SOURCE_MERGE_POLICY | Hybrid 模式字段合并策略 JSON （示例见下文）                        |
| VITE_DATA_CONFIG_PATH         | 外部集中配置 JSON 路径 (public 下相对路径或绝对 URL)               |
| VITE_DATA_CONFIG_POLL_MS      | (可选) 轮询外部配置间隔毫秒，默认 5000（仅 DEV 或显式启用）        |
| VITE_DATA_CONFIG_POLL_ENABLE  | (可选) 在非 DEV 环境也启用轮询: "true"                             |

## API 集成

## 数据源策略（合约 / 后端 / Hybrid）

为满足“链上为真 + 后端增强”场景，提供统一数据源抽象：

| 级别 | Hook              | 描述                                                 |
| ---- | ----------------- | ---------------------------------------------------- |
| 列表 | `useShowsData()`  | 根据配置返回 `data`、`source`、`loading`、`fetching` |
| 详情 | `useShowData(id)` | 同上，单条记录                                       |

### 选择模式

通过环境变量或运行时配置：

```
VITE_DATA_SOURCE_SHOWS_LIST=hybrid
VITE_DATA_SOURCE_SHOW_DETAIL=backend
```

支持三种取值：

1. `contract` 仅链上（默认）
2. `backend` 仅后端 REST
3. `hybrid` 先拿链上主数据，再用后端字段补充 / 覆盖（可配置精细化策略）

运行时动态调整：

```ts
import { setDataSourceConfig, getDataSourceConfig } from "@/config/dataSource";
setDataSourceConfig({ showsList: "backend", showDetail: "hybrid" });
console.log(getDataSourceConfig());
// 浏览器调试也可查看 window.__DATA_SOURCE_CONFIG__
```

### Hybrid 字段合并策略

通过 `VITE_DATA_SOURCE_MERGE_POLICY`（JSON 字符串）控制字段级合并：

```env
VITE_DATA_SOURCE_MERGE_POLICY={"defaultMode":"coalesce","listFields":{"description":"preferBackend"},"detailFields":{"location":"preferBackend"}}
```

字段模式说明：

| 模式              | 行为                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `preferContract`  | 优先使用链上值；链上值为空/undefined/null/"" 时回落后端值        |
| `preferBackend`   | 优先使用后端值；后端为空时回落链上值                             |
| `coalesce` (默认) | 若后端存在（可为 null? 否，null 视为缺失）则使用后端，否则用链上 |

支持配置：

```jsonc
{
  "defaultMode": "coalesce", // 未显式指定字段时的兜底
  "listFields": {
    // 仅列表合并使用
    "description": "preferBackend",
    "name": "preferContract"
  },
  "detailFields": {
    // 详情视图合并
    "location": "preferBackend"
  }
}
```

### Hook 返回结构（示例）

```ts
const { data, source, loading, fetching, error, refetch, contract, backend } =
  useShowsData();
// data: 统一格式数组；hybrid 下每项含 _contract / _backend 原始对象引用
```

### 常见使用模式

1. 调试后端新字段：`showsList=hybrid`，让后端字段逐步“渗透”页面
2. 回退保障：后端离线时保底仍可展示合约最小可用数据
3. SEO / 静态预渲染：未来可让 backend 模式给服务端渲染层提供更完整内容

### 注意事项

- Hybrid 未对分页差异做特殊处理（后端分页 + 链上全量场景需要后续扩展）
- 字段为空判定逻辑：空字符串 / null / undefined 视为“无有效值”
- 如果后端返回结构变更，合并策略无需修改——仅在字段名一致时生效
- 可为将来添加字段（如 category / tags）直接扩展 mergePolicy JSON

### 外部集中配置（dataConfig.json）

如果不希望在多个环境变量中分散配置，可以在 `.env` 中声明：

```
VITE_DATA_CONFIG_PATH=/config/dataConfig.json
```

然后在 `public/config/dataConfig.json`（或任意可访问 URL）中集中维护：

```json
{
  "dataSources": {
    "showsList": "hybrid",
    "showDetail": "backend"
  },
  "mergePolicy": {
    "defaultMode": "coalesce",
    "listFields": { "description": "preferBackend" },
    "detailFields": { "location": "preferBackend" }
  }
}
```

优先级：外部文件 > 单项 env > 默认值。运行时仍可通过 `setDataSourceConfig` 临时覆盖；刷新页面会再次按优先级加载。

### 数据源 Dev 面板（可视化 / 策略编辑 / 热更新）

已拆分为独立文档，详见：`docs/DEV_DATA_SOURCE_PANEL.md`

快速要点：
| 功能 | 概览 |
| ---- | ---- |
| 实时切换数据源 | showsList / showDetail contract/backend/hybrid |
| 编辑合并策略 | defaultMode + 字段级 listFields/detailFields |
| localStorage 持久化 | 覆盖写入 `__DATA_SOURCE_CONFIG_OVERRIDE__` |
| 外部 JSON 热更新 | 轮询差异触发刷新（DEV 默认 5s） |
| 重置覆盖 | 一键回到外部 JSON + env 基线 |
| JSON 导出 | 复制当前有效组合配置 |

### Shows API

项目集成了 `/show` 后端接口，支持获取演出信息的前端调用。

#### 使用示例

```typescript
import { useShows, useShow, usePaginatedShows } from "@/hooks/useShows";

// 获取演出列表
function ShowsList() {
  const { data: shows, loading, error, reload } = useShows();

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {shows.map((show) => (
        <div key={show.id}>{show.name}</div>
      ))}
    </div>
  );
}

// 获取单个演出
function ShowDetail({ id }: { id: string }) {
  const { data: show, loading, error } = useShow(id);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!show) return <div>演出不存在</div>;

  return (
    <div>
      {show.name}: {show.description}
    </div>
  );
}

// 分页演出列表
function PaginatedShows() {
  const {
    data: shows,
    pagination,
    loading,
    params,
    goToPage,
    changePageSize,
  } = usePaginatedShows({ page: 1, pageSize: 10 });

  return (
    <div>
      {shows.map((show) => (
        <div key={show.id}>{show.name}</div>
      ))}
      <button onClick={() => goToPage(params.page + 1)}>下一页</button>
    </div>
  );
}
```

### 后端 API 错误 Toast 开关

系统默认在调用后端 REST Hooks（如 `useBackendShows`, `useBackendShow`）时，将错误通过全局 Toast 弹出。可通过以下方式关闭：

1. 环境变量：在 `.env` 中添加

```
VITE_API_ERROR_TOAST=off
```

2. 运行时（浏览器控制台 / 代码中动态切换）

```ts
import { setApiErrorToastEnabled } from "@/config/app";

// 关闭
setApiErrorToastEnabled(false);
// 开启
setApiErrorToastEnabled(true);
```

3. 调试：当前状态可在控制台查看 `window.__API_ERROR_TOAST__`。

> 注意：关闭后，错误仍可通过 hook 返回的 `error` 字段自行处理。

#### API 函数

```typescript
import { fetchShows, fetchShow } from "@/api/show";

// 直接调用API（不使用hooks）
const shows = await fetchShows({ page: 1, pageSize: 20 });
const show = await fetchShow("123");
```

#### 类型定义

```typescript
interface Show {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // 兼容后端扩展字段
}

interface ShowListParams {
  page?: number;
  pageSize?: number;
}
```

## 快速开始

```bash
pnpm install # 或 npm install
npm run dev
```

## 脚本

| 脚本    | 说明         |
| ------- | ------------ |
| dev     | 开发调试     |
| build   | 构建产物     |
| preview | 本地预览构建 |
| test    | 运行单元测试 |
| lint    | ESLint 检查  |

## 架构概览

| 层                  | 说明                                               |
| ------------------- | -------------------------------------------------- |
| abis/               | 合约 ABI + 地址解析 getAddress()                   |
| hooks/useContracts  | 链上读写 + 交易状态接入 txQueue                    |
| lib/queryClient     | React Query 客户端 + 策略                          |
| lib/txQueue         | 交易状态机 (wallet→sent→confirming→success/failed) |
| components/feedback | ToastProvider + TxToastBridge                      |
| components/tx       | TxCenter 面板                                      |
| lib/errors          | 错误分类/规范化 mapError()                         |
| lib/i18n            | i18nProvider 底座                                  |
| schemas/            | Zod 业务校验                                       |
| pages/              | 页面级组件                                         |

## 交易状态与通知

1. 写操作调用 trackWalletAction 记录临时项
2. 获得 tx hash -> markSent
3. 等待确认 -> markConfirming
4. 成功/失败 -> markSuccess / markFailed
5. TxToastBridge 监听 store 推送 toast

## TODO （Roadmap 摘要）

- Marketplace / Swap 实现
- MyTickets 链上真实数据
- 乐观更新与事件订阅
- 国际化文案抽取 & 英文资源
- 更细粒度测试覆盖

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
