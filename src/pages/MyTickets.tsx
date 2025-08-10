import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useGetAllEvents } from '../hooks/useContracts';

interface Ticket {
  id: string;
  eventId: number;
  eventName: string;
  eventDate: Date;
  location: string;
  price: string;
  status: 'valid' | 'used' | 'transferred';
}

export function MyTickets() {
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'valid' | 'used'>('all');
  const { events, isLoading: eventsLoading } = useGetAllEvents();

  useEffect(() => {
    if (!isConnected) {
      navigate('/wallet');
      return;
    }

    // 获取用户门票数据
  const fetchTickets = async () => {
      setLoading(true);

      try {
        // TODO: 实际应用中会从智能合约读取用户的NFT门票
        // 这里需要实现以下功能：
        // 1. 调用合约查询用户拥有的门票NFT
        // 2. 获取每个门票对应的活动信息
        // 3. 检查门票状态（是否已使用）

        // 暂时使用模拟数据，但结构与真实数据保持一致
  // (占位) 未来这里将从链上读取用户 TicketToken 列表并映射到活动
  const mockTickets: Ticket[] = events ? [
          {
            id: '1',
            eventId: 1,
            eventName: events[0]?.name || '音乐节 2025',
            eventDate: events[0]?.startTime || new Date('2025-08-15T19:00:00'),
            location: events[0]?.venue || '上海体育场',
            price: '0.299',
            status: 'valid'
          },
          {
            id: '2',
            eventId: 2,
            eventName: events[1]?.name || '科技大会 2025',
            eventDate: events[1]?.startTime || new Date('2025-07-20T09:00:00'),
            location: events[1]?.venue || '北京国家会议中心',
            price: '0.199',
            status: 'used'
          }
        ] : [];

        // 模拟异步获取数据
        setTimeout(() => {
          setTickets(mockTickets);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取门票数据失败:', error);
        setTickets([]);
        setLoading(false);
      }
    };

    // 只有在不加载events数据时才获取门票
    if (!eventsLoading) {
      fetchTickets();
    }
  }, [isConnected, address, navigate, events, eventsLoading]);

  const filteredTickets = tickets.filter(ticket => {
    if (selectedTab === 'all') return true;
    return ticket.status === selectedTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'transferred':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return '有效';
      case 'used':
        return '已使用';
      case 'transferred':
        return '已转让';
      default:
        return '未知';
    }
  };

  if (!isConnected) {
    return null; // 会被重定向到钱包页面
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的门票</h1>
        <button
          onClick={() => navigate('/events')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          浏览更多活动
        </button>
      </div>

      {/* 标签页 */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'all', label: '全部' },
          { key: 'valid', label: '有效门票' },
          { key: 'used', label: '已使用' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {(loading || eventsLoading) && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 门票列表 */}
      {!loading && !eventsLoading && (
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold mb-2">暂无门票</h3>
              <p className="text-muted-foreground mb-6">
                {selectedTab === 'all'
                  ? '您还没有购买任何门票'
                  : `您没有${selectedTab === 'valid' ? '有效' : '已使用'}的门票`
                }
              </p>
              <button
                onClick={() => navigate('/events')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
              >
                去购买门票
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{ticket.eventName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          {ticket.eventDate.toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{ticket.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span>{ticket.price} ETH</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/events/${ticket.eventId}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition-colors"
                    >
                      查看活动
                    </button>

                    {ticket.status === 'valid' && (
                      <>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                          onClick={() => {
                            // 这里会实现门票转让功能
                            alert('门票转让功能开发中...');
                          }}
                        >
                          转让门票
                        </button>

                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                          onClick={() => {
                            // 这里会实现门票使用功能
                            alert('门票使用功能开发中...');
                          }}
                        >
                          使用门票
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 门票ID和区块链信息 */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>门票 ID: #{ticket.id}</span>
                    <span>NFT 门票</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 门票统计 */}
      {!loading && !eventsLoading && tickets.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'valid').length}
            </div>
            <div className="text-green-700 font-medium">有效门票</div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {tickets.filter(t => t.status === 'used').length}
            </div>
            <div className="text-gray-700 font-medium">已使用</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.reduce((total, ticket) => total + parseFloat(ticket.price), 0).toFixed(3)}
            </div>
            <div className="text-blue-700 font-medium">总消费 (ETH)</div>
          </div>
        </div>
      )}
    </div>
  );
}
