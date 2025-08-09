import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../layout';
import { Home } from '../pages/Home';
import { Events } from '../pages/Events';
import { EventDetail, MyTickets, Marketplace, TokenSwap, Profile, CreateEvent, Wallet } from '../pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'events/:id',
        element: <EventDetail />,
      },
      {
        path: 'my-tickets',
        element: <MyTickets />,
      },
      {
        path: 'wallet',
        element: <Wallet />,
      },
      {
        path: 'marketplace',
        element: <Marketplace />,
      },
      {
        path: 'swap',
        element: <TokenSwap />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'create-event',
        element: <CreateEvent />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

// 路由配置
export const routes = [
  {
    path: '/',
    name: '首页',
    icon: 'Home',
  },
  {
    path: '/events',
    name: '活动',
    icon: 'Calendar',
  },
  {
    path: '/my-tickets',
    name: '我的门票',
    icon: 'Ticket',
    requireAuth: true,
  },
  {
    path: '/marketplace',
    name: '市场',
    icon: 'ShoppingBag',
  },
  {
    path: '/swap',
    name: '交换',
    icon: 'ArrowLeftRight',
  },
] as const;
