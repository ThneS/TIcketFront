import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireWallet: React.FC<Props> = ({ children, fallback }) => {
  const { isConnected, connect } = useWallet();
  const nav = useNavigate();
  const loc = useLocation();

  if (!isConnected) {
    return (
      fallback || (
        <div className="p-6 border rounded text-center space-y-4">
          <p className="text-sm text-muted-foreground">需要连接钱包才能访问此页面。</p>
          <button
            onClick={() => connect()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >连接钱包</button>
          <button
            onClick={() => nav('/', { replace: true, state: { from: loc.pathname } })}
            className="text-xs text-blue-500 hover:underline block w-full"
          >返回首页</button>
        </div>
      )
    );
  }
  return <>{children}</>;
};
