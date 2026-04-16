import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

export interface RealTimeSale {
  id: number;
  customer_id?: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  payment_method: string;
  invoice_number: string;
  sale_date: string;
}

export const useSocketIO = (onNewSale?: (sale: RealTimeSale) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Initialize Socket.io connection
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket.io connected:", socketRef.current?.id);
      isConnectedRef.current = true;
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket.io disconnected");
      isConnectedRef.current = false;
    });

    socketRef.current.on("new_sale", (sale: RealTimeSale) => {
      console.log("📦 New sale event received:", sale);
      if (onNewSale) {
        onNewSale(sale);
      }
    });

    socketRef.current.on("error", (error: any) => {
      console.error("Socket.io error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onNewSale]);

  const isConnected = useCallback(() => isConnectedRef.current, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
  };
};
