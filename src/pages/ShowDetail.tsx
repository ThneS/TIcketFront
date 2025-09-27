import { useParams, useNavigate } from "react-router-dom";
// import { buildIpfsHttpUrl } from "../lib/ipfs.ts"; // 现阶段核心信息仅使用链上 getShow 数据，元数据统一放入附加属性
import { useState, useEffect } from "react";
import { useMintTicket } from "../hooks/useContracts"; // 保留直接链上创建/购买逻辑
import { useShowData } from "../hooks";
import { useIpfsJson } from "../hooks/useIpfsJson";
import { useWallet } from "../hooks/useWallet";
import { formatEther } from "viem";

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const [ticketCount, setTicketCount] = useState(1);

  // 获取演出详情
  const {
    data: merged,
    source,
    loading: eventLoading,
    error: eventError,
  } = useShowData(id || undefined);
  // unified show：优先使用合约结构；若仅 backend 则已在 hook 内适配为合约风格字段
  const show: any =
    merged && (merged as any)._contract ? (merged as any)._contract : merged;

  // 适配多种可能字段（metadataURI / metadata_uri / meta.uri / ipfs）
  const metadataUri: string | undefined = (() => {
    if (!show || typeof show !== "object") return undefined;
    return (
      show.metadataURI ||
      show.metadata_uri ||
      show.ipfs ||
      show?.meta?.uri ||
      undefined
    );
  })();

  // 解析 metadata（若存在 metadataURI）
  const {
    data: metadata,
    isLoading: metaLoading,
    error: metaError,
  } = useIpfsJson(metadataUri, {
    enabled: !!metadataUri,
    maxAgeMs: 10 * 60 * 1000,
  });

  // 购买门票相关
  const {
    mintTicket,
    isPending: isMinting,
    isConfirming,
    isSuccess: isConfirmed,
    error: mintError,
  } = useMintTicket();

  // 如果门票购买成功，跳转到我的门票页面
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        navigate("/my-tickets");
      }, 2000);
    }
  }, [isConfirmed, navigate]);

  const handleBuyTicket = async () => {
    if (!isConnected || !show) {
      alert("请先连接钱包");
      return;
    }

    try {
      // 传入单张票价，内部 hook 会乘以数量
      await mintTicket(id!, ticketCount, BigInt(show.ticketPrice));
    } catch (error) {
      console.error("购买门票失败:", error);
    }
  };

  if (eventLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (eventError || !show) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">演出不存在</h1>
          <p className="text-muted-foreground mb-4">
            抱歉，找不到您要查看的演出。
          </p>
          <button
            onClick={() => navigate("/shows")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            返回演出列表
          </button>
        </div>
      </div>
    );
  }

  const eventDate =
    show.startTime instanceof Date
      ? show.startTime
      : new Date(show.startTime as any);
  const ticketPrice = show.ticketPrice
    ? formatEther(show.ticketPrice as any)
    : "0";
  const soldTickets = Number(show.soldTickets);
  const maxTickets = Number(show.maxTickets);
  const isEventActive = show.isActive;
  const isSoldOut = soldTickets >= maxTickets;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate("/shows")}
        className="mb-6 text-blue-500 hover:text-blue-600 flex items-center gap-2"
      >
        ← 返回演出列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 演出图片 */}
        <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-3xl font-bold mb-2">{show.name}</h2>
            <p className="text-xl opacity-90">演出海报</p>
          </div>
        </div>

        {/* 演出信息和购票区域 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{show.name}</h1>
            <p className="text-xs text-gray-400">数据源: {source}</p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {show.description}
            </p>
            {metaLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                正在加载链下元数据...
              </p>
            )}
            {metaError && (
              <p className="text-xs text-red-600 mt-2">
                元数据加载失败: {metaError.message}
              </p>
            )}
          </div>

          {/* 演出详细信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold">演出时间</p>
                <p className="text-muted-foreground">
                  {eventDate.toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-semibold">演出地点</p>
                <p className="text-muted-foreground">{show.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫</span>
              <div>
                <p className="font-semibold">门票信息</p>
                <p className="text-muted-foreground">
                  已售出 {soldTickets} / {maxTickets} 张
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold">门票价格</p>
                <p className="text-2xl font-bold text-blue-600">
                  {ticketPrice} ETH
                </p>
              </div>
            </div>
            {/* 不再在核心信息区展示 metadata.external_url，统一放到附加属性 */}
          </div>

          {/* 购票区域 */}
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-xl font-semibold">购买门票</h3>

            {!isEventActive && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">此活动暂未开始售票</p>
              </div>
            )}

            {isSoldOut && isEventActive && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">门票已售罄</p>
              </div>
            )}

            {!isConnected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">请先连接钱包以购买门票</p>
              </div>
            )}

            {isEventActive && !isSoldOut && isConnected && (
              <>
                <div className="flex items-center gap-4">
                  <label className="font-medium">购买数量:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTicketCount(Math.max(1, ticketCount - 1))
                      }
                      className="w-8 h-8 rounded border hover:bg-gray-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">
                      {ticketCount}
                    </span>
                    <button
                      onClick={() =>
                        setTicketCount(
                          Math.min(maxTickets - soldTickets, ticketCount + 1)
                        )
                      }
                      className="w-8 h-8 rounded border hover:bg-gray-100 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    总价: {(parseFloat(ticketPrice) * ticketCount).toFixed(4)}{" "}
                    ETH
                  </span>
                </div>

                <button
                  onClick={handleBuyTicket}
                  disabled={isMinting || isConfirming}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {isMinting && "确认交易中..."}
                  {isConfirming && "等待确认..."}
                  {isConfirmed && "购买成功!"}
                  {!isMinting && !isConfirming && !isConfirmed && "立即购买"}
                </button>

                {mintError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                      购买失败: {mintError.message}
                    </p>
                  </div>
                )}

                {isConfirmed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      门票购买成功！正在跳转到我的门票页面...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 演出组织者信息 */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">演出组织者</h3>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {show.organizer}
            </p>
            {metadata && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">
                  附加属性 (来自 metadataURI):
                </p>
                <div className="space-y-1">
                  {(() => {
                    const rows: { label: string; value: any }[] = [];
                    try {
                      const entries = Object.entries(metadata as any);
                      for (const [k, v] of entries) {
                        if (k === "attributes" && Array.isArray(v)) continue; // 单独处理
                        rows.push({ label: k, value: v });
                      }
                      if (Array.isArray((metadata as any).attributes)) {
                        for (const attr of (metadata as any).attributes) {
                          const label = attr?.trait_type || attr?.key || "attr";
                          rows.push({ label, value: attr?.value });
                        }
                      }
                      // 如果有 image / external_url，改为链接展示
                      return rows.map((r, i) => {
                        let val: any = r.value;
                        if (typeof val === "object" && val !== null) {
                          try {
                            val = JSON.stringify(val);
                          } catch {
                            val = String(val);
                          }
                        }
                        const isUrl =
                          typeof val === "string" &&
                          /^(ipfs:\/\/|https?:\/\/)/i.test(val);
                        return (
                          <div
                            key={i}
                            className="text-xs text-muted-foreground flex gap-2 break-all"
                          >
                            <span className="font-medium">{r.label}:</span>
                            {isUrl ? (
                              <a
                                href={val.startsWith("ipfs://") ? val : val}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline decoration-dotted"
                              >
                                {val}
                              </a>
                            ) : (
                              <span>
                                {val === undefined || val === null || val === ""
                                  ? "-"
                                  : String(val)}
                              </span>
                            )}
                          </div>
                        );
                      });
                    } catch {
                      return (
                        <div className="text-xs text-red-500">
                          无法解析元数据结构
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
