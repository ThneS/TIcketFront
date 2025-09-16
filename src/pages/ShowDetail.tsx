import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGetShow, useMintTicket } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { formatEther } from "viem";

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const [ticketCount, setTicketCount] = useState(1);

  // 获取演出详情
  const {
    show,
    isLoading: eventLoading,
    error: eventError,
  } = useGetShow(id || undefined);

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
      await mintTicket(
        id!,
        ticketCount,
        BigInt(show.ticketPrice) * BigInt(ticketCount)
      );
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

  const eventDate = new Date(show.startTime);
  const ticketPrice = formatEther(show.ticketPrice);
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
            <h1 className="text-3xl font-bold mb-4">{show.name}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {show.description}
            </p>
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
            <p className="text-sm text-muted-foreground font-mono">
              {show.organizer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
