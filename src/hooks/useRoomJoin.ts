"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket, emitWithAck } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/config/socket_events";
import { useAuth } from "@/contexts/AuthContext";

interface RoomJoinResult {
  success: boolean;
  room?: {
    id: string;
    code: string;
    title: string;
    description?: string;
    status: string;
    hostId: string;
    maxParticipants: number;
    currentParticipants: number;
  };
  error?: string;
  requiresAuth?: boolean;
  roomNotFound?: boolean;
  roomNotAvailable?: boolean;
}

interface UseRoomJoinOptions {
  roomCode: string;
  onSuccess?: (room: RoomJoinResult["room"]) => void;
  onError?: (error: string) => void;
  onAuthRequired?: () => void;
}

export const useRoomJoin = ({
  roomCode,
  onSuccess,
  onError,
  onAuthRequired,
}: UseRoomJoinOptions) => {
  const [isJoining, setIsJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<RoomJoinResult | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const hasAttemptedJoin = useRef(false);

  const joinRoom = useCallback(async () => {
    if (!roomCode || isJoining || joinResult || hasAttemptedJoin.current) {
      console.log("Skipping join - already attempted or in progress");
      return;
    }

    hasAttemptedJoin.current = true;
    setIsJoining(true);
    setJoinResult(null);

    try {
      console.log("Attempting to join room:", roomCode);

      // Emit room join event with user information
      const result = await emitWithAck<RoomJoinResult>(
        SOCKET_EVENTS.ROOM.JOIN,
        {
          code: roomCode,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
        }
      );

      console.log("Room join result:", result);

      if (result.success) {
        setJoinResult(result);
        onSuccess?.(result.room);
      } else {
        // Handle different error cases
        if (result.requiresAuth) {
          console.log("Authentication required");
          onAuthRequired?.();
          router.push("/auth/login");
        } else if (result.roomNotFound) {
          console.log("Room not found");
          onError?.(
            "Room not found. Please check the room code and try again."
          );
        } else if (result.roomNotAvailable) {
          console.log("Room not available");
          onError?.(
            "This room is not currently available. It may have ended or been deleted."
          );
        } else {
          console.log("General error:", result.error);
          onError?.(result.error || "Failed to join room. Please try again.");
        }
        setJoinResult(result);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      const errorMessage =
        "Network error. Please check your connection and try again.";
      onError?.(errorMessage);
      setJoinResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsJoining(false);
    }
  }, [
    roomCode,
    user,
    isJoining,
    onSuccess,
    onError,
    onAuthRequired,
    router,
    joinResult,
  ]);

  // Auto-join when room code is available and user is authenticated
  useEffect(() => {
    if (
      roomCode &&
      isAuthenticated &&
      user &&
      !isJoining &&
      !joinResult &&
      !hasAttemptedJoin.current
    ) {
      console.log("Auto-joining room:", roomCode);
      joinRoom();
    }
  }, [roomCode, isAuthenticated, user?.id, joinRoom]); // Include joinRoom in deps

  // Listen for room join response events
  useEffect(() => {
    const socket = getSocket();

    const handleRoomJoined = (data: RoomJoinResult) => {
      console.log("Room joined event received:", data);
      if (data.success) {
        setJoinResult(data);
        onSuccess?.(data.room);
      }
    };

    const handleRoomJoinError = (data: {
      error: string;
      requiresAuth?: boolean;
      roomNotFound?: boolean;
      roomNotAvailable?: boolean;
    }) => {
      console.log("Room join error event received:", data);
      const result: RoomJoinResult = {
        success: false,
        error: data.error,
        requiresAuth: data.requiresAuth,
        roomNotFound: data.roomNotFound,
        roomNotAvailable: data.roomNotAvailable,
      };

      setJoinResult(result);

      if (data.requiresAuth) {
        onAuthRequired?.();
        router.push("/auth/login");
      } else {
        onError?.(data.error);
      }
    };

    // Listen for room join responses
    socket.on(SOCKET_EVENTS.RESPONSE.ROOM_JOINED, handleRoomJoined);
    socket.on("room:join-error", handleRoomJoinError);

    return () => {
      socket.off(SOCKET_EVENTS.RESPONSE.ROOM_JOINED, handleRoomJoined);
      socket.off("room:join-error", handleRoomJoinError);
    };
  }, [onSuccess, onError, onAuthRequired, router]);

  // Reset function to allow retrying
  const resetJoin = useCallback(() => {
    hasAttemptedJoin.current = false;
    setJoinResult(null);
    setIsJoining(false);
  }, []);

  return {
    joinRoom,
    isJoining,
    joinResult,
    canJoin: !!roomCode && isAuthenticated && !!user,
    resetJoin,
  };
};
