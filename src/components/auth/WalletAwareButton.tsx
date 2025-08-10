import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import clsx from 'clsx';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requireWallet?: boolean;
  reason?: string;
}

export const WalletAwareButton: React.FC<Props> = ({ requireWallet = true, reason, disabled, children, className, ...rest }) => {
  const { isConnected, connect } = useWallet();
  const shouldDisable = requireWallet && !isConnected;
  return (
    <button
      {...rest}
      disabled={disabled || shouldDisable}
      onClick={(e) => {
        if (shouldDisable) {
          e.preventDefault();
            connect();
          return;
        }
        rest.onClick?.(e);
      }}
      className={clsx(
        'px-4 py-2 rounded transition-colors',
        shouldDisable ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white',
        className
      )}
      title={shouldDisable ? reason || '请先连接钱包' : rest.title}
    >
      {children}
    </button>
  );
};
