import { useNavigate } from "react-router-dom";
import { WalletAwareButton } from "../components/auth/WalletAwareButton";
import { useGetAllShows, type Show } from "../hooks/useContracts";
import { formatEther } from "viem";
import { formatDate } from "../lib/time";

interface MockShow {
  id: number;
  name: string;
  description: string;
  location: string;
  eventTime: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  soldTickets: bigint;
  isActive: boolean;
  organizer: string;
}

export function Shows() {
  const navigate = useNavigate();
  const { shows, isLoading, error } = useGetAllShows();

  const mockShows: MockShow[] = [
    {
      id: 1,
      name: "音乐节 2025",
      description: "一年一度的盛大音乐节，汇聚全球顶级艺人",
      location: "上海体育场",
      eventTime: BigInt(
        Math.floor(new Date("2025-08-15T19:00:00").getTime() / 1000)
      ),
      ticketPrice: BigInt("299000000000000000"),
      maxTickets: BigInt(10000),
      soldTickets: BigInt(3500),
      isActive: true,
      organizer: "0x1234...5678",
    },
    {
      id: 2,
      name: "科技大会 2025",
      description: "探讨人工智能与区块链技术的未来发展",
      location: "北京国家会议中心",
      eventTime: BigInt(
        Math.floor(new Date("2025-07-20T09:00:00").getTime() / 1000)
      ),
      ticketPrice: BigInt("199000000000000000"),
      maxTickets: BigInt(5000),
      soldTickets: BigInt(2800),
      isActive: true,
      organizer: "0x5678...9abc",
    },
    {
      id: 3,
      name: "艺术展览",
      description: "当代艺术与数字藏品的完美结合",
      location: "广州现代艺术馆",
      eventTime: BigInt(
        Math.floor(new Date("2025-09-10T10:00:00").getTime() / 1000)
      ),
      ticketPrice: BigInt("99000000000000000"),
      maxTickets: BigInt(3000),
      soldTickets: BigInt(1200),
      isActive: true,
      organizer: "0x9abc...def0",
    },
  ];

  const displayShows = shows && shows.length > 0 ? shows : mockShows;

  interface ShowCardData {
    id: number;
    name: string;
    description: string;
    venue: string;
    eventTime: bigint; // seconds
    ticketPrice: bigint;
    maxTickets: bigint;
    soldTickets: bigint;
    isActive: boolean;
    organizer: string;
  }

  const getShowData = (show: Show | MockShow): ShowCardData => {
    if ("eventTime" in show) {
      // MockShow 分支
      return {
        id: show.id,
        name: show.name,
        description: show.description,
        venue: show.location,
        eventTime: show.eventTime,
        ticketPrice: show.ticketPrice,
        maxTickets: show.maxTickets,
        soldTickets: show.soldTickets,
        isActive: show.isActive,
        organizer: show.organizer,
      };
    }
    // 链上 Show 分支
    return {
      id: Number(show.id),
      name: show.name,
      description: show.description,
      venue: show.location,
      eventTime: BigInt(Math.floor(show.startTime.getTime() / 1000)),
      ticketPrice: show.ticketPrice,
      maxTickets: show.maxTickets,
      soldTickets: show.soldTickets,
      isActive: show.isActive,
      organizer: show.organizer,
    };
  };

  const handleShowClick = (showId: number) => {
    navigate(`/shows/${showId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演出列表</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">演出列表</h1>
        <WalletAwareButton
          requireWallet={false}
          onClick={() => navigate("/create-show")}
          title="创建新演出"
        >
          创建演出
        </WalletAwareButton>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            无法加载演出数据，显示模拟数据。请确保智能合约已正确部署。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayShows.map((show: Show | MockShow, index: number) => {
          const data = getShowData(show);
          const eventDate = new Date(Number(data.eventTime) * 1000);
          const ticketPrice = formatEther(data.ticketPrice);
          const soldPercentage =
            (Number(data.soldTickets) / Number(data.maxTickets)) * 100;

          return (
            <div
              key={data.id || index}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleShowClick(data.id || index + 1)}
            >
              <div
                className={`h-48 bg-gradient-to-r ${
                  index % 4 === 0
                    ? "from-blue-500 to-purple-600"
                    : index % 4 === 1
                    ? "from-green-500 to-teal-600"
                    : index % 4 === 2
                    ? "from-pink-500 to-rose-600"
                    : "from-orange-500 to-red-600"
                } flex items-center justify-center`}
              >
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">{data.name}</h3>
                  <p className="text-sm opacity-90">点击查看详情</p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{data.name}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {data.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      📅 {formatDate(eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      📍 {data.venue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      已售 {Number(data.soldTickets)} /{" "}
                      {Number(data.maxTickets)} 张
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        data.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {data.isActive ? "售票中" : "已结束"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    {ticketPrice} ETH
                  </span>
                  <WalletAwareButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowClick(data.id || index + 1);
                    }}
                  >
                    查看详情
                  </WalletAwareButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayShows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold mb-2">暂无演出</h3>
          <p className="text-muted-foreground mb-6">
            还没有任何演出，快来创建第一个演出吧！
          </p>
          <button
            onClick={() => navigate("/create-show")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            创建演出
          </button>
        </div>
      )}
    </div>
  );
}
