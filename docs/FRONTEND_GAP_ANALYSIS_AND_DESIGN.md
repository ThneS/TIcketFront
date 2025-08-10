# OnlineTicket 前端剩余设计与差距分析

> 目标：对照主仓库愿景（智能合约 + README），评估当前实现，形成剩余功能设计与技术规划，指导迭代交付。

## 1. 当前实现概览（Snapshot）

- 技术栈：React + TS + Vite + Tailwind + RainbowKit + Wagmi + Zustand
- 已有页面：Home / Events / EventDetail / MyTickets（含模拟数据）
- 占位页面：Marketplace / TokenSwap / Profile / CreateEvent / Wallet
- 合约交互：useContracts.ts 仅含简化 ABI 与占位地址，读取/创建/购票/转让 Hook 雏形（实际数据仍为 mock）
- 状态：无 React Query 集成（依赖已安装），Zustand 仅用于主题/语言，占位 wallet 状态
- 表单：无 React Hook Form + Zod 实际使用
- 国际化：未实现（仅硬编码中文）
- 错误处理：ErrorBoundary 存在但未在根部明确包裹（需确认入口）
- 安全 & UX：缺少 loading skeleton 统一规范、交易状态 toasts、签名/授权流程

## 2. 与目标功能对照的差距

| 模块     | 目标能力                     | 当前状态        | 差距摘要                                   |
| -------- | ---------------------------- | --------------- | ------------------------------------------ |
| 活动浏览 | 列表/筛选/分页/搜索          | 基础列表 + mock | 缺搜索/过滤/分页/缓存/空态策略             |
| 活动详情 | 实时库存/动态按钮状态        | 基础展示 + mock | 缺多票种/动态价格/结束逻辑/转跳防护        |
| 创建活动 | 多票种 / 验证 / 上链         | 占位            | 缺表单/票种数组/Zod 校验/调用/回退策略     |
| 我的门票 | NFT 列表 / 状态 / 交互       | mock            | 缺链上查询 / 分页 / 使用 & 转让 / QR 码    |
| 门票转让 | P2P 转让 / 验证              | Hook 雏形       | 缺 UI / 输入 ENS / 结果反馈 / 防误操作     |
| 二级市场 | 挂单/购买/撤单               | 占位            | 缺订单列表 / 价格排序 / 授权 / 事件刷新    |
| 代币交换 | Swap / 添加流动性 / 价格预估 | 占位            | 缺 Token 列表 / 额度授权 / 滑点 / 报价缓存 |
| 平台代币 | 余额显示 / 支付集成          | 未实现          | 缺 ERC20 查询 / allowance 管理             |
| 验票系统 | 二维码生成 / 扫码核销        | 未实现          | 缺二维码生成/核销状态更新/防重放           |
| 钱包管理 | 资产/网络/多账户             | 基础 Connect    | 缺网络错误提示 / 统一连接入口 / 断线恢复   |
| 交易状态 | 全局队列 / Toast / 重试      | 简单按钮文案    | 缺统一 Tx Manager / Etherscan 跳转         |
| 国际化   | zh / en 切换                 | 未实现          | 缺 i18n 基础与词条抽离                     |
| 可访问性 | a11y / 语义化                | 部分            | 缺焦点管理 / aria 标签                     |
| 测试     | 单元 / 集成 / 合约模拟       | 无              | 缺 vitest + msw + wagmi mock 体系          |

## 3. 信息架构 & 路由最终设计

```
/                         Home (营销 & CTA)
/events                    活动列表（搜索/过滤/分页）
/events/:id                活动详情（多票种 / 购买）
/create-event              活动创建（分步表单）
/my-tickets                我的门票（标签：全部/有效/已用/已转让）
/my-tickets/:ticketId      门票详情 + 二维码
/marketplace               二级市场（列表/筛选）
/marketplace/:orderId      挂单详情（购买/撤单）
/swap                      代币交换（报价 / 滑点）
/liquidity                 流动性管理（添加/移除）
/profile                   用户资料 / 历史交易
/verify                    验票入口（输入/扫码）
/admin/events              组织者活动面板（统计）
```

## 4. 合约交互矩阵（前端 -> 合约）

| 功能         | 合约                         | 方法                                       | 前端封装计划                      | 备注                                              |
| ------------ | ---------------------------- | ------------------------------------------ | --------------------------------- | ------------------------------------------------- |
| 获取活动列表 | EventManager                 | getAllEvents()                             | useEventsQuery                    | 批量并行 getEvent 需多调用优化（缓存 + 并发控制） |
| 获取活动详情 | EventManager                 | getEvent(id)                               | useEventQuery                     | React Query 缓存 key: ['event', id]               |
| 创建活动     | EventManager                 | createEvent(...)                           | useCreateEventMutation            | 乐观更新 + 回滚                                   |
| 购票         | TicketManager                | mintTicket(eventId, qty) payable           | useMintTicketsMutation            | 价格 \* qty 校验、余额检查                        |
| 查询门票     | TicketManager                | balanceOf / tokenOfOwnerByIndex / tokenURI | useMyTicketsQuery                 | 若无枚举函数需后端索引或事件回放                  |
| 转让门票     | TicketManager                | transferFrom                               | useTransferTicketMutation         | 前置 isApprovedForAll 检查                        |
| 挂单         | Marketplace                  | list(tokenId, price)                       | useCreateOrderMutation            | 需先 approve                                      |
| 取消订单     | Marketplace                  | cancel(orderId)                            | useCancelOrderMutation            | 状态刷新 invalidate                               |
| 购买挂单     | Marketplace                  | buy(orderId) payable                       | useBuyOrderMutation               | 支付币种判断                                      |
| 代币余额     | ERC20                        | balanceOf                                  | useTokenBalanceQuery              | 多币种并行                                        |
| 授权额度     | ERC20                        | allowance/approve                          | useAllowance / useApproveMutation | Swap & Marketplace 复用                           |
| 兑换报价     | TokenSwap                    | getAmountOut / getReserves                 | useSwapQuoteQuery                 | 轮询 + 缓存 3~5s                                  |
| 兑换执行     | TokenSwap                    | swapExactTokensForTokens                   | useSwapMutation                   | 滑点保护 deadline 参数                            |
| 添加流动性   | TokenSwap                    | addLiquidity                               | useAddLiquidityMutation           | 价格比例提示                                      |
| 移除流动性   | TokenSwap                    | removeLiquidity                            | useRemoveLiquidityMutation        | LP 代币余额校验                                   |
| 验票         | TicketManager 或 Verify 合约 | markUsed(tokenId, sig)                     | useVerifyTicketMutation           | 需签名或角色权限                                  |

## 5. 技术设计要点

### 5.1 数据层

- 引入 React Query：统一缓存 / 重试 / 失效策略
- Query Keys 规范：`['events']`, `['event', id]`, `['tickets', address]`, `['orders', filters]`
- Stale 时间策略：静态（活动详情）> 动态（订单 / 报价）

### 5.2 状态管理职责拆分

| 工具           | 作用                                             |
| -------------- | ------------------------------------------------ |
| React Query    | 远程链上数据缓存 / 请求生命周期                  |
| Zustand        | UI 偏好 / 全局 UI 状态（主题 / 语言 / 交易队列） |
| 内部局部 state | 表单临时数据                                     |

### 5.3 交易管理 (Tx Manager)

- 统一 Hook：useTxQueue => { submit(txPromise), list, status, dismiss }
- 状态阶段：idle -> pending (钱包) -> sent(hash) -> confirming(block) -> success / failed
- UI：右下角 Drawer + Toast

### 5.4 错误与重试策略

| 场景          | 策略                                   |
| ------------- | -------------------------------------- |
| 网络/节点超时 | 重试（指数退避最多 3 次）              |
| Gas 估算失败  | 提示可能原因（余额不足 / 合约拒绝）    |
| 用户拒签      | 归档为 cancelled，不提示错误           |
| 价格波动      | Swap 前二次确认：报价 > 滑点阈值则阻断 |

### 5.5 表单架构

- React Hook Form + Zod schema 分层：/schemas/event.ts,/schemas/swap.ts
- 分步创建活动：基本信息 → 票种设置 (动态 FieldArray) → 价格与时间 → 确认

### 5.6 组件库规划

| 分类 | 组件                                                           |
| ---- | -------------------------------------------------------------- |
| 基础 | Button / Input / Select / Modal / Tabs / Tooltip / Skeleton    |
| 业务 | EventCard / TicketCard / OrderCard / SwapPanel / LiquidityForm |
| 反馈 | TxToast / StatusBadge / EmptyState                             |
| 验票 | QrCodeCanvas / ScanResultPanel                                 |

### 5.7 国际化 (Phase 2)

- 库：i18next + react-i18next
- 目录：/src/i18n/locales/{zh, en}/common.json
- 初始命名空间：common, events, tickets, swap

### 5.8 安全与防护

- 只读节点与写节点分离（可选未来）
- 金额输入归一化 BigInt 处理，避免浮点风险
- 地址校验：viem `isAddress`
- 授权额度 >= 本次使用量否则弹窗引导 approve
- 防重复提交：基于 pending hash 锁

### 5.9 性能优化

- 路由懒加载 + 动态 import
- 列表分页 + 无限滚动（IntersectionObserver）
- Skeleton 与虚拟滚动（大型订单列表）
- SWR 时间分级：报价轮询 3s，其它 30~120s stale

### 5.10 验票流程设计（前端）

1. 用户在“我的门票”进入门票详情 → 展示二维码 (tokenId + 随机 nonce + 签名 或 encode URI)
2. 验票端（/verify）扫描 → 本地调用合约 / 后端校验事件 → 返回有效/已用/非法
3. 成功后刷新门票状态（invalidate tickets）

## 6. 目录扩展规划

```
src/
  components/
    business/
      EventCard.tsx
      TicketCard.tsx
      OrderCard.tsx
      SwapPanel.tsx
    feedback/
      TxToast.tsx
      StatusBadge.tsx
      EmptyState.tsx
  features/
    events/
      hooks/
      components/
      pages/
    tickets/
    marketplace/
    swap/
    verify/
  schemas/
    event.ts
    ticket.ts
    marketplace.ts
    swap.ts
  lib/
    queryClient.ts
    txManager.ts
    i18n.ts
```

## 7. 测试策略

| 层级          | 工具                                    | 范围                        |
| ------------- | --------------------------------------- | --------------------------- |
| 单元          | vitest + @testing-library/react         | 纯函数、组件渲染            |
| 合约交互模拟  | viem + foundry/anvil + wagmi test utils | Hook 行为                   |
| 集成          | msw 模拟 RPC 失败/超时                  | 重试 / 错误 UI              |
| E2E (Phase 2) | Playwright                              | 核心购票 / 转让 / Swap 流程 |

## 8. 里程碑划分（详见开发计划文件）

- M1 基础数据与创建活动
- M2 门票与转让
- M3 市场与 Swap MVP
- M4 验票与优化
- M5 国际化 + 测试覆盖 + 上线准备

## 9. 风险与缓解

| 风险             | 影响         | 缓解                       |
| ---------------- | ------------ | -------------------------- |
| 合约接口变动     | Hook 重写    | 版本锁定 + types 生成脚本  |
| 缺少枚举门票方法 | 无法直接列出 | 事件索引 + 后端服务 / 子图 |
| 高并发订单刷新   | 性能下降     | Query 分页 + 增量轮询      |
| 报价波动         | 用户失败体验 | 双报价确认 + 滑点校验      |
| 用户拒签频繁     | 干扰统计     | 过滤拒签不计入失败         |

## 10. 指标 (KPIs)

- 首次可交互 (TTI) < 3s (本地) / < 5s (生产)
- 关键交互错误率 < 1%
- 交易成功率 ≥ 95%（不含用户拒签）
- 页面级缓存命中率 ≥ 70%

## 11. 合约 ABI 获取与地址注入方案

### 11.1 ABI 来源与生成

- 使用 Foundry 构建：`forge build` 在主仓库生成 `out/<Contract>.sol/<Contract>.json`
- 通过脚本抽取所需字段（abi）复制到前端 `src/abis/*.json`
- 推荐自动化脚本（示例）：
  ```bash
  jq '.abi' ../out/EventManager.sol/EventManager.json > src/abis/EventManager.json
  jq '.abi' ../out/TicketManager.sol/TicketManager.json > src/abis/TicketManager.json
  # 可扩展：Marketplace / PlatformToken / TokenSwap
  ```
- 长期方案：在 monorepo 中使用包 `packages/abis` 输出类型化 ABI（PNPM workspace）

### 11.2 地址配置优先级

1. 多网络 JSON（`VITE_CONTRACTS_JSON`）形式：`{"31337":{"EVENT_MANAGER":"0x..."}}`
2. 单地址扁平变量：`VITE_EVENT_MANAGER=0x...`
3. 兜底：本地 mock（禁止在生产使用）

### 11.3 访问函数

- 统一封装 `getAddress(key, chainId)` 逻辑（已在 `src/abis/index.ts`）
- Hook 中使用：
  ```ts
  const { chain } = useAccount();
  const address = getAddress("eventManager", chain?.id);
  ```
- 未配置时抛出显式错误，阻断交易类调用

### 11.4 类型安全与 Tree-shaking

- `import eventManager from './EventManager.json' assert { type: 'json' }` (Vite 可直接导入)
- 通过 `as const` 锁定结构，wagmi 调用时获得字面量类型提示
- 可选：使用 `viem` 代码生成（未来）

### 11.5 多网络切换场景

| 场景               | 处理                     | UI 提示                |
| ------------------ | ------------------------ | ---------------------- |
| 地址缺失           | 抛错                     | Toast: 未配置合约地址  |
| 用户切换到未支持链 | 返回 undefined           | Banner: 当前链暂不支持 |
| 部署升级           | 更新 env 变量 & 重新构建 | 显示版本号 (commit)    |

### 11.6 安全注意事项

- 不在前端硬编码私钥/管理员地址
- 升级/迁移采用新变量名（避免缓存旧值）
- 生产部署前校验：所有必需地址非 0x0 (CI 脚本)

### 11.7 CI 预检脚本示例（伪）

```bash
REQUIRED=(VITE_EVENT_MANAGER VITE_TICKET_MANAGER VITE_MARKETPLACE VITE_PLATFORM_TOKEN)
for k in "${REQUIRED[@]}"; do
  [[ -z "${!k}" ]] && echo "Missing $k" && exit 1
  [[ ${!k} =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "Invalid address format: $k"; exit 1; }
  [[ ${!k} != 0x0000000000000000000000000000000000000000 ]] || { echo "Zero address: $k"; exit 1; }
  echo "✔ $k=${!k}"
done
```

### 11.8 后续自动化方向

- 加入 `make export-abis`：统一拷贝 & 压缩 abi
- 结合 `changeset` 发布 `@onlineticket/abis` npm 包
- 使用 `wagmi cli generate` 输出 hooks（减少手写）

---

本文件用于指导后续详细实现与任务拆分，随开发迭代更新。
