# OnlineTicket 前端开发计划（迭代版）

时间假设：每个迭代 ~1 周（可并行适度重叠）。优先保障核心购票闭环，其次市场与 Swap，最后体验 & 国际化。

## 总览里程碑

| 里程碑                   | 目标                         | 核心交付                                               | 完成标志                      |
| ------------------------ | ---------------------------- | ------------------------------------------------------ | ----------------------------- |
| M1 基础数据层 & 创建活动 | 建立真实活动数据读写         | Events 列表 + EventDetail + CreateEvent 表单（单票种） | 可创建并读取链上活动          |
| M2 门票获取与管理        | 用户可购票并在“我的门票”查看 | 购票流程 + MyTickets 链上数据 + 转让基础               | 真实 NFT 显示与状态更新       |
| M3 市场 & 授权           | 可挂单/购买/撤单             | Marketplace 列表 + 授权流程 + Toast Tx 管理            | 一买一卖全流程成功            |
| M4 Swap MVP & 流动性     | 基础代币互换                 | Swap 报价/执行 + allowance + 简单 add/remove           | 能成功换出目标代币            |
| M5 验票 & QR             | 线下核销能力                 | Ticket Detail + QR 展示 + /verify 页面（模拟核销）     | 扫码后 ticket 状态为 used     |
| M6 UX & 国际化 & 测试    | 完成体验与质量提升           | i18n zh/en + vitest 覆盖 + 性能优化                    | CI 测试通过 + Lighthouse ≥ 85 |
| M7 上线准备              | 打包与部署                   | 环境变量/打包脚本/监控埋点                             | 生产构建可部署                |

## 迭代详细任务

### M1 基础数据层 & 创建活动

1. 引入 React Query（queryClient + Provider）
2. 重构 useContracts：按功能拆分 hooks (events, tickets, marketplace, swap)
3. 真实 EventManager ABI + 合约地址 .env 注入
4. useEventsQuery / useEventQuery 实现（并行 getEvent 逻辑 + 缓存）
5. CreateEvent 表单（React Hook Form + Zod schema）
6. 创建成功后 invalidate events & 跳转详情
7. Loading Skeleton 组件 & 列表占位统一
8. 错误边界在根应用包裹 + Fallback UI

### M2 门票获取与管理

1. TicketManager ABI & 地址配置
2. 购票 useMintTicketsMutation：价格计算 + 校验
3. MyTickets 查询策略：
   - 如果合约提供枚举：直接循环 tokenOfOwnerByIndex
   - 否则：临时使用事件抓取 (可 mock)
4. TicketCard 组件 / 状态徽章 StatusBadge
5. 门票转让对话框 (输入地址/ENS + 校验)
6. 全局 TxManager（队列 + Toast）
7. Ticket 详情页 + QRCode 数据结构预留

### M3 市场 & 授权

1. Marketplace ABI / 地址 / list + buy + cancel mutation
2. ERC721 approve / setApprovalForAll 流程整合
3. OrderCard 组件 & 过滤（我的挂单 / 全部）
4. 授权弹窗（检测不足时触发）
5. 事件监听 / 轮询刷新（订单创建/成交）
6. 性能：分页 + 无限滚动

### M4 Swap MVP & 流动性

1. TokenSwap ABI: getReserves / getAmountOut / swapExact...
2. useSwapQuoteQuery（轮询 3s; 价格缓存）
3. allowance 检查 + Approve 合并按钮
4. SwapPanel 组件（TokenSelector / AmountInput / Slippage 设置）
5. Add/Remove Liquidity 简化表单 (只支持两种主池)
6. 错误分类：滑点 / 额度不足 / 余额不足

### M5 验票 & QR

1. Ticket QR 数据：`ticketId|nonce|sig?` （sig 可后端 Phase2）
2. 生成二维码 (qrcode.react)
3. /verify 页面：输入或扫码（先输入模式）
4. useVerifyTicketMutation（模拟：调用合约 markUsed 或 mock）
5. 验票结果反馈 (绿色/红色卡片)
6. MyTickets 状态自动刷新

### M6 UX & 国际化 & 测试

1. i18n 基础设施 + 文案抽取
2. 主题切换（增加 dark class & 持久化）
3. Loading / Empty / Error 统一组件
4. vitest 配置 + 核心 hooks 与组件测试
5. Playwright 脚手架（后续补充）
6. Lighthouse 报告 & 性能调优（代码分割、压缩）

### M7 上线准备

1. 环境变量文档 (.env.example)
2. 构建产物分析（bundle-analyzer）
3. Sentry 集成（可选）
4. CI: lint + test + build workflow
5. README 前端章节更新 + 部署指引 (Vercel / Netlify)

## 任务优先级标签

- P0：阻断主流程（购票、创建、读取）
- P1：增强核心体验（市场、Swap、转让）
- P2：扩展与优化（国际化、验票、测试）

## 资源与分工示例

| 角色 | 负责模块                     |
| ---- | ---------------------------- |
| FE-1 | Events + Tickets + TxManager |
| FE-2 | Marketplace + Swap           |
| FE-3 | QR 验票 + 国际化 + 测试体系  |

## 环境变量规划 (.env.example)

```
VITE_EVENT_MANAGER=0x...
VITE_TICKET_MANAGER=0x...
VITE_MARKETPLACE=0x...
VITE_TOKEN_SWAP=0x...
VITE_PLATFORM_TOKEN=0x...
VITE_WALLET_CONNECT_PROJECT_ID=xxxxx
```

## Definition of Done (DoD) 统一标准

- 通过 lint & type check
- UI 在移动 / 桌面正常显示
- 失败 / 加载 / 空态覆盖
- 有至少 1 个 vitest 单测（核心逻辑）
- 文档或代码注释更新（如新增 Hook）
- 交易类操作有 Toast + 状态追踪

## 关键复用 Hooks 清单

| Hook                         | 作用                          |
| ---------------------------- | ----------------------------- |
| useEventsQuery               | 获取活动集合（批处理 + 缓存） |
| useEventQuery                | 获取单活动                    |
| useCreateEventMutation       | 创建活动                      |
| useMintTicketsMutation       | 购票                          |
| useMyTicketsQuery            | 用户门票                      |
| useTransferTicketMutation    | 转让                          |
| useOrdersQuery               | 市场订单                      |
| useCreateOrderMutation       | 挂单                          |
| useSwapQuoteQuery            | 获取兑换报价                  |
| useSwapMutation              | 执行兑换                      |
| useAllowance(token, spender) | 授权额度查询                  |
| useApproveMutation           | 授权                          |
| useTxQueue                   | 全局交易状态管理              |

## 指标追踪 (添加埋点 Phase 2)

| 指标                         | 说明             |
| ---------------------------- | ---------------- |
| event_load_time              | 活动列表首包时间 |
| ticket_purchase_success_rate | 购票成功率       |
| order_fill_rate              | 挂单成交率       |
| swap_failure_reason          | 兑换失败分类     |

---

此计划随版本推进迭代更新，重大调整需在 PR 中同步 docs。

---

## 扩展 Roadmap 批次（后续规划）

### 批次 A：多票种事件 & Swap 基础

**目标**：支持一个活动多票种定义及基础代币兑换报价/执行。
**任务**：

- [ ] ticketTierSchema / createEventSchemaV2（多票种）
- [ ] CreateEvent V2 动态票种 UI（增删/校验/预览）
- [ ] EventDetail 显示票种列表 + 选择购票
- [ ] useReserves / useSwapQuote（3s 轮询 + 输入 debounce）
- [ ] Swap 页面：方向切换、滑点设置、报价展示、执行按钮
- [ ] 乐观更新：创建活动时注入占位 event + tiers

### 批次 B：Ticket 使用 / 核销 & Telemetry 基础

**目标**：门票使用状态流转；错误聚合上报。
**任务**：

- [ ] 扩展 TicketManager ABI（useTicket / TicketUsed 事件）
- [ ] useUseTicket hook + 乐观状态 (valid→usedPending→used)
- [ ] MyTickets 接入使用按钮与状态刷新
- [ ] telemetryBuffer store（聚合 mapError 输出）
- [ ] Query/Mutation onError 接入 pushError
- [ ] 定时/阈值 flush /api/telemetry/errors（失败重试）
- [ ] 错误去重（message+category+1min 窗口）

### 批次 C：数据源抽象 & Off-chain 索引

**目标**：可切换链上直接读取与 TheGraph/自建 API。
**任务**：

- [ ] eventsSource 接口（list/detail/userTickets）
- [ ] onChainSource 封装现有合约读逻辑
- [ ] graphSource 占位（GraphQL 查询样例）
- [ ] 配置切换 VITE_DATA_SOURCE=chain|graph|api
- [ ] Fallback：graph 失败回退链上
- [ ] 缓存 key 标准化：['events', source, filters]

### 批次 D：PWA / 缓存策略

**目标**：离线体验 + 静态资源优化。
**任务**：

- [ ] 集成 vite-plugin-pwa + manifest/icons
- [ ] 预缓存静态构建产物 + runtime 缓存策略
- [ ] offline.html + UI 提示
- [ ] events 快照持久化（localStorage / IndexedDB）
- [ ] React Query 持久化（过滤敏感数据）
- [ ] SW 更新提示“新版本可用”

### 批次 E：增强与体验打磨

**目标**：提高可用性与可观测性。
**任务**：

- [ ] ENS 解析 + 地址输入自动格式化
- [ ] 价格影响 / 高滑点风险提示
- [ ] TxCenter 懒加载 & 列表虚拟化（大量交易）
- [ ] 时区/本地化时间选项
- [ ] 动态日志级别切换（UI 按钮）

### 批次 F：后续扩展（预研）

**可能方向**：

- Off-chain 活动推荐算法 / 排序
- 实时订阅 (WebSocket) 增量刷新 events/orders
- QR 核销签名校验（后端）
- Bundle 分析与微前端拆分
