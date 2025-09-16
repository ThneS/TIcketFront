import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">OnlineTicket</h1>
        <p className="text-xl text-muted-foreground mb-8">
          基于区块链的去中心化门票管理平台
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/shows"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            浏览演出
          </Link>
          <Link
            to="/create-show"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            创建演出
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">安全透明</h3>
            <p className="text-muted-foreground">
              基于区块链技术，防伪造、防篡改
            </p>
          </div>

          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold mb-2">二级市场</h3>
            <p className="text-muted-foreground">支持门票安全转让与交易</p>
          </div>

          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">代币经济</h3>
            <p className="text-muted-foreground">平台代币支付，享受更多优惠</p>
          </div>
        </div>
      </div>
    </div>
  );
}
