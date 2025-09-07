/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { io, Socket } from "socket.io-client";
import browserCookie from "./cookie";

let socket: Socket | null = null;
let currentToken: string | undefined = undefined;

export function getSocket(): Socket {
  if (socket) return socket;

  // Only initialize socket on client side
  if (typeof window === "undefined") {
    throw new Error("Socket can only be initialized on the client side");
  }

  // Get auth token from cookies
  const token = browserCookie.getBrowserToken();
  currentToken = token;

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
    // Pass auth token in connection headers
    auth: {
      token: token,
    },
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
      console.log("resp ==>", { resp });
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (resp?.error) reject(resp.error);
      else resolve(resp as T);
    });
  });
}

// Function to refresh socket connection with new auth token
export function refreshSocketConnection(): void {
  if (socket) {
    const newToken = browserCookie.getBrowserToken();

    // Only reconnect if token has changed
    if (newToken !== currentToken) {
      console.log("Auth token changed, reconnecting socket...");
      socket.disconnect();
      socket = null;
      currentToken = newToken;
      // Socket will be recreated on next getSocket() call
    }
  }
}

// Function to disconnect socket (useful for logout)
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = undefined;
  }
}
