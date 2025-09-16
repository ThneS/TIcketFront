export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">OnlineTicket</h3>
            <p className="text-sm text-muted-foreground">
              基于区块链的去中心化门票管理平台
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">产品</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/shows" className="hover:text-primary">
                  演出
                </a>
              </li>
              <li>
                <a href="/marketplace" className="hover:text-primary">
                  市场
                </a>
              </li>
              <li>
                <a href="/swap" className="hover:text-primary">
                  代币交换
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">开发者</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  文档
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">社区</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 OnlineTicket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
