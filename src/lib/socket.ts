/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  // Use the proxied WebSocket URL through Next.js
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || "";
  socket = io(url, {
    path: "/ws",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    withCredentials: true,
    // If your JWT is in same-site cookie, the browser will include it automatically on same-origin.
    // If cross-origin w/ cookie, ensure SameSite=None; Secure on the cookie and CORS credentials=true on server.
  });
  return socket;
}

// Promise wrapper for ack-based events with timeout
export function emitWithAck<T = any>(
  event: string,
  payload?: any,
  timeoutMs = 8000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error(`Ack timed out for ${event}`));
      }
    }, timeoutMs);

    s.emit(event, payload ?? {}, (resp: any) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (resp?.error) reject(resp.error);
      else resolve(resp as T);
    });
  });
}
