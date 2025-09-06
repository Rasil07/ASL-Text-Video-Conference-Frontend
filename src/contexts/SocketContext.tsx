"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSocket } from "@/lib/socket";

type SocketCtx = {
  connected: boolean;
};
const Ctx = createContext<SocketCtx>({ connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
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

  const value = useMemo(() => ({ connected }), [connected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSocketConnection = () => useContext(Ctx);
