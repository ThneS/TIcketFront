// Placeholder types & hooks for marketplace orders
import { useQuery } from "@tanstack/react-query";

export interface Order {
  id: string;
  ticketId: string;
  showId: string; // 原 eventId
  seller: string;
  price: string; // ETH string
  status: "open" | "filled" | "cancelled";
  createdAt: number;
}

// Mock fetcher (to be replaced by contract reads)
async function fetchOrders(): Promise<Order[]> {
  return [
    {
      id: "1",
      ticketId: "12",
      showId: "1",
      seller: "0x1234...abcd",
      price: "0.15",
      status: "open",
      createdAt: Date.now() - 3600_000,
    },
  ];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 10_000,
  });
}
