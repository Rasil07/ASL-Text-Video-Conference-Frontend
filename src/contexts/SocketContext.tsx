"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSocket,
  refreshSocketConnection,
  disconnectSocket,
} from "@/lib/socket";

type SocketCtx = {
  connected: boolean;
  isClient: boolean;
  refreshConnection: () => void;
  disconnect: () => void;
};
const Ctx = createContext<SocketCtx>({
  connected: false,
  isClient: false,
  refreshConnection: () => {},
  disconnect: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);

    const s = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  // Function to refresh connection (useful when auth token changes)
  const refreshConnection = () => {
    refreshSocketConnection();
    setConnected(false); // Will be updated when socket reconnects
  };

  // Function to disconnect (useful for logout)
  const disconnect = () => {
    disconnectSocket();
    setConnected(false);
  };

  const value = useMemo(
    () => ({
      connected,
      isClient,
      refreshConnection,
      disconnect,
    }),
    [connected, isClient]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSocketConnection = () => useContext(Ctx);
