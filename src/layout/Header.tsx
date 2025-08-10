import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { routes } from '../router';
import { TxCenterDropdown } from '../components/tx/TxCenter';

export function Header() {
  const location = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-primary">
          OnlineTicket
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {routes.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === route.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {route.name}
            </Link>
          ))}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          <TxCenterDropdown />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
