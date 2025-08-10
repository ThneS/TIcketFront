import { useNavigate } from 'react-router-dom';
import { WalletAwareButton } from '../components/auth/WalletAwareButton';
import { useGetAllEvents, type Event } from '../hooks/useContracts';
import { formatEther } from 'viem';
import { formatDate } from '../lib/time';

// 用于模拟数据的事件接口（与真实Event接口兼容）
interface MockEvent {
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

export function Events() {
  const navigate = useNavigate();
  const { events, isLoading, error } = useGetAllEvents();

  // 模拟活动数据（当智能合约数据不可用时）
  const mockEvents: MockEvent[] = [
    {
      id: 1,
      name: '音乐节 2025',
      description: '一年一度的盛大音乐节，汇聚全球顶级艺人',
      location: '上海体育场',
      eventTime: BigInt(Math.floor(new Date('2025-08-15T19:00:00').getTime() / 1000)),
      ticketPrice: BigInt('299000000000000000'), // 0.299 ETH
      maxTickets: BigInt(10000),
      soldTickets: BigInt(3500),
      isActive: true,
      organizer: '0x1234...5678'
    },
    {
      id: 2,
      name: '科技大会 2025',
      description: '探讨人工智能与区块链技术的未来发展',
      location: '北京国家会议中心',
      eventTime: BigInt(Math.floor(new Date('2025-07-20T09:00:00').getTime() / 1000)),
      ticketPrice: BigInt('199000000000000000'), // 0.199 ETH
      maxTickets: BigInt(5000),
      soldTickets: BigInt(2800),
      isActive: true,
      organizer: '0x5678...9abc'
    },
    {
      id: 3,
      name: '艺术展览',
      description: '当代艺术与数字藏品的完美结合',
      location: '广州现代艺术馆',
      eventTime: BigInt(Math.floor(new Date('2025-09-10T10:00:00').getTime() / 1000)),
      ticketPrice: BigInt('99000000000000000'), // 0.099 ETH
      maxTickets: BigInt(3000),
      soldTickets: BigInt(1200),
      isActive: true,
      organizer: '0x9abc...def0'
    }
  ];

  // 使用真实数据或模拟数据
  const displayEvents = events && events.length > 0 ? events : mockEvents;

  // 处理事件数据的统一接口
  const getEventData = (event: Event | MockEvent) => {
    if ('location' in event) {
      // 模拟数据
      return {
        id: event.id,
        name: event.name,
        description: event.description,
        venue: event.location,
        eventTime: event.eventTime,
        ticketPrice: event.ticketPrice,
        maxTickets: event.maxTickets,
        soldTickets: event.soldTickets,
        isActive: event.isActive,
        organizer: event.organizer
      };
    } else {
      // 真实数据
      return {
        id: Number(event.id),
        name: event.name,
        description: event.description,
        venue: event.venue,
        eventTime: BigInt(Math.floor(event.startTime.getTime() / 1000)),
        ticketPrice: event.ticketPrice,
        maxTickets: event.maxTickets,
        soldTickets: event.soldTickets,
        isActive: event.isActive,
        organizer: event.organizer
      };
    }
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">活动列表</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden animate-pulse">
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
        <h1 className="text-3xl font-bold">活动列表</h1>
  <WalletAwareButton onClick={() => navigate('/create-event')}>创建活动</WalletAwareButton>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            无法加载活动数据，显示模拟数据。请确保智能合约已正确部署。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayEvents.map((event: Event | MockEvent, index: number) => {
          const eventData = getEventData(event);
          const eventDate = new Date(Number(eventData.eventTime) * 1000);
          const ticketPrice = formatEther(eventData.ticketPrice);
          const soldPercentage = (Number(eventData.soldTickets) / Number(eventData.maxTickets)) * 100;

          return (
            <div
              key={eventData.id || index}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleEventClick(eventData.id || index + 1)}
            >
              {/* 活动图片 */}
              <div className={`h-48 bg-gradient-to-r ${
                index % 4 === 0 ? 'from-blue-500 to-purple-600' :
                index % 4 === 1 ? 'from-green-500 to-teal-600' :
                index % 4 === 2 ? 'from-pink-500 to-rose-600' :
                'from-orange-500 to-red-600'
              } flex items-center justify-center`}>
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">{eventData.name}</h3>
                  <p className="text-sm opacity-90">点击查看详情</p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{eventData.name}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {eventData.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      📅 {formatDate(eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      📍 {eventData.venue}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      已售 {Number(eventData.soldTickets)} / {Number(eventData.maxTickets)} 张
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      eventData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {eventData.isActive ? '售票中' : '已结束'}
                    </span>
                  </div>

                  {/* 进度条 */}
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
                      handleEventClick(eventData.id || index + 1);
                    }}
                  >查看详情</WalletAwareButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayEvents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold mb-2">暂无活动</h3>
          <p className="text-muted-foreground mb-6">
            还没有任何活动，快来创建第一个活动吧！
          </p>
          <button
            onClick={() => navigate('/create-event')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            创建活动
          </button>
        </div>
      )}
    </div>
  );
}