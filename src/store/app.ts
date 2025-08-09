import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState, WalletState } from '../types';

interface AppStore extends AppState {
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'zh-CN' | 'en-US') => void;
  setWallet: (wallet: Partial<WalletState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  reset: () => void;
}

const initialState: AppState = {
  theme: 'light',
  language: 'zh-CN',
  wallet: {
    isConnected: false,
  },
  loading: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, _get) => ({
        ...initialState,

        setTheme: (theme) => set({ theme }, false, 'setTheme'),

        setLanguage: (language) => set({ language }, false, 'setLanguage'),

        setWallet: (walletUpdate) =>
          set(
            (state) => ({
              wallet: { ...state.wallet, ...walletUpdate },
            }),
            false,
            'setWallet'
          ),

        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'onlineticket-app-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    { name: 'App Store' }
  )
);
