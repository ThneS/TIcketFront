// 重新导出真实的页面组件
export { EventDetail } from './EventDetail';
export { MyTickets } from './MyTickets';

// 临时页面组件
export function Marketplace() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">二级市场</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p className="text-muted-foreground">
          二级市场功能正在开发中，将支持门票转让和交易功能。
        </p>
      </div>
    </div>
  );
}

export function TokenSwap() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">代币交换</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p className="text-muted-foreground">
          代币交换功能正在开发中，将支持平台代币与ETH的兑换。
        </p>
      </div>
    </div>
  );
}

export function Profile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">个人资料</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p className="text-muted-foreground">
          个人资料页面正在开发中，将包含用户设置和活动历史。
        </p>
      </div>
    </div>
  );
}

export function CreateEvent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">创建活动</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p className="text-muted-foreground">
          创建活动功能正在开发中，将支持活动信息填写、门票配置、智能合约部署等功能。
        </p>
      </div>
    </div>
  );
}

export function Wallet() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">钱包管理</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p className="text-muted-foreground">
          钱包管理页面正在开发中，将支持钱包连接、余额查看、交易历史等功能。
        </p>
      </div>
    </div>
  );
}
