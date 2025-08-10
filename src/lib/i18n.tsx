import React, { createContext, useContext, useState, useMemo } from 'react';

// Minimal i18n foundation (ZH default)
export type Locale = 'zh' | 'en';

interface Dict { [k: string]: string | Dict; }

const zh: Dict = {
  common: {
    loading: '加载中',
    confirm: '确认',
    cancel: '取消',
  },
  tx: {
    waitingSignature: '等待签名',
    sent: '已发送',
    confirming: '确认中',
    success: '成功',
    failed: '失败',
    cancelled: '已取消'
  }
};

const en: Dict = {
  common: {
    loading: 'Loading',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  tx: {
    waitingSignature: 'Waiting for signature',
    sent: 'Sent',
    confirming: 'Confirming',
    success: 'Success',
    failed: 'Failed',
    cancelled: 'Cancelled'
  }
};

const DICTS: Record<Locale, Dict> = { zh, en };

function lookup(dict: Dict, path: string): string | undefined {
  return path.split('.').reduce<any>((acc, key) => (acc && acc[key]) || undefined, dict) as any;
}

interface I18nContextValue {
  locale: Locale;
  t: (path: string, fallback?: string) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ initial?: Locale; children: React.ReactNode }> = ({ initial = 'zh', children }) => {
  const [locale, setLocale] = useState<Locale>(initial);
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (path: string, fallback?: string) => {
      const res = lookup(DICTS[locale], path);
      return (typeof res === 'string' ? res : undefined) || fallback || path;
    }
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
