import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "../layout";
import { Home } from "../pages/Home";
import { Shows } from "../pages/Shows";
import {
  ShowDetail,
  MyTickets,
  Marketplace,
  TokenSwap,
  Profile,
  CreateShow,
  Wallet,
} from "../pages";
import { RequireWallet } from "../components/auth/RequireWallet";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "shows",
        element: <Shows />,
      },
      {
        path: "shows/:id",
        element: <ShowDetail />,
      },
      {
        path: "my-tickets",
        element: (
          <RequireWallet>
            <MyTickets />
          </RequireWallet>
        ),
      },
      {
        path: "wallet",
        element: <Wallet />,
      },
      {
        path: "marketplace",
        element: <Marketplace />,
      },
      {
        path: "swap",
        element: <TokenSwap />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "create-show",
        element: <CreateShow />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

// 路由配置
export const routes = [
  {
    path: "/",
    name: "首页",
    icon: "Home",
  },
  {
    path: "/shows",
    name: "演出",
    icon: "Calendar",
  },
  {
    path: "/my-tickets",
    name: "我的门票",
    icon: "Ticket",
    requireAuth: true,
  },
  {
    path: "/marketplace",
    name: "市场",
    icon: "ShoppingBag",
  },
  {
    path: "/swap",
    name: "交换",
    icon: "ArrowLeftRight",
  },
] as const;
