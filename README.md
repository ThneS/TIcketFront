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

| 变量                | 描述                                                              |
| ------------------- | ----------------------------------------------------------------- |
| VITE_EVENT_MANAGER  | EventManager 合约地址                                             |
| VITE_TICKET_MANAGER | TicketManager 合约地址                                            |
| VITE_MARKETPLACE    | Marketplace 合约地址                                              |
| VITE_PLATFORM_TOKEN | 平台 Token 地址                                                   |
| VITE_TOKEN_SWAP     | TokenSwap 合约地址                                                |
| VITE_API_BASE_URL   | 后端API基础URL (e.g. http://localhost:3001)                       |
| VITE_CONTRACTS_JSON | 多网络 JSON 映射 (e.g. {"11155111": {"EVENT_MANAGER": "0x..."}} ) |

## API 集成

### Shows API

项目集成了 `/show` 后端接口，支持获取演出信息的前端调用。

#### 使用示例

```typescript
import { useShows, useShow, usePaginatedShows } from '@/hooks/useShows';

// 获取演出列表
function ShowsList() {
  const { data: shows, loading, error, reload } = useShows();
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  
  return (
    <div>
      {shows.map(show => (
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
  
  return <div>{show.name}: {show.description}</div>;
}

// 分页演出列表
function PaginatedShows() {
  const { 
    data: shows, 
    pagination, 
    loading, 
    params, 
    goToPage, 
    changePageSize 
  } = usePaginatedShows({ page: 1, pageSize: 10 });
  
  return (
    <div>
      {shows.map(show => <div key={show.id}>{show.name}</div>)}
      <button onClick={() => goToPage(params.page + 1)}>
        下一页
      </button>
    </div>
  );
}
```

#### API 函数

```typescript
import { fetchShows, fetchShow } from '@/api/show';

// 直接调用API（不使用hooks）
const shows = await fetchShows({ page: 1, pageSize: 20 });
const show = await fetchShow('123');
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
