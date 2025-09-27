import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "./lib/i18n";
import { config } from "./services/wagmi";
import { router } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import { queryClient } from "./lib/queryClient";
import { DataSourceDevPanel } from "./components/dev/DataSourceDevPanel";
import {
  ToastProvider,
  TxToastBridge,
} from "./components/feedback/ToastProvider";
// 可选：开发环境启用 React Query Devtools
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <I18nProvider>
              <ToastProvider>
                <RouterProvider router={router} />
                <TxToastBridge />
                <DataSourceDevPanel />
              </ToastProvider>
            </I18nProvider>
            {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
