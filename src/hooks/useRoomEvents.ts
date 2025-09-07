/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/config/socket_events";
import { MeetingSummary } from "@/types";

interface RoomEventHandlers {
  onRoomCreated?: (room: MeetingSummary) => void;
  onRoomUpdated?: (room: MeetingSummary) => void;
  onRoomDeleted?: (roomId: string) => void;
  onRoomListChanged?: (rooms: MeetingSummary[]) => void;
  onRoomEnded?: (roomId: string) => void;
  onParticipantJoined?: (data: { code: string; participant: any }) => void;
  onParticipantLeft?: (data: { code: string; participantId: string }) => void;
  onParticipantStatusUpdated?: (data: {
    roomId: string;
    participantId: string;
    status: any;
  }) => void;
  onHostTransferred?: (data: { roomId: string; newHostId: string }) => void;
}

export const useRoomEvents = (handlers: RoomEventHandlers) => {
  const socket = getSocket();

  // Room creation event
  const handleRoomCreated = useCallback(
    (room: MeetingSummary) => {
      console.log("Room created:", room);
      handlers.onRoomCreated?.(room);
    },
    [handlers.onRoomCreated]
  );

  // Room updated event
  const handleRoomUpdated = useCallback(
    (room: MeetingSummary) => {
      console.log("Room updated:", room);
      handlers.onRoomUpdated?.(room);
    },
    [handlers.onRoomUpdated]
  );

  // Room deleted event
  const handleRoomDeleted = useCallback(
    (roomId: string) => {
      console.log("Room deleted:", roomId);
      handlers.onRoomDeleted?.(roomId);
    },
    [handlers.onRoomDeleted]
  );

  // Room list changed event
  const handleRoomListChanged = useCallback(
    (rooms: MeetingSummary[]) => {
      console.log("Room list changed:", rooms);
      handlers.onRoomListChanged?.(rooms);
    },
    [handlers.onRoomListChanged]
  );

  // Room ended event
  const handleRoomEnded = useCallback(
    (roomId: string) => {
      console.log("Room ended:", roomId);
      handlers.onRoomEnded?.(roomId);
    },
    [handlers.onRoomEnded]
  );

  // Participant events
  const handleParticipantJoined = useCallback(
    (data: { roomId: string; participant: any }) => {
      console.log("Participant joined:", data);
      handlers.onParticipantJoined?.(data);
    },
    [handlers.onParticipantJoined]
  );

  const handleParticipantLeft = useCallback(
    (data: { roomId: string; participantId: string }) => {
      console.log("Participant left:", data);
      handlers.onParticipantLeft?.(data);
    },
    [handlers.onParticipantLeft]
  );

  const handleParticipantStatusUpdated = useCallback(
    (data: { roomId: string; participantId: string; status: any }) => {
      console.log("Participant status updated:", data);
      handlers.onParticipantStatusUpdated?.(data);
    },
    [handlers.onParticipantStatusUpdated]
  );

  const handleHostTransferred = useCallback(
    (data: { roomId: string; newHostId: string }) => {
      console.log("Host transferred:", data);
      handlers.onHostTransferred?.(data);
    },
    [handlers.onHostTransferred]
  );

  useEffect(() => {
    // Only set up listeners on client side
    if (typeof window === "undefined") {
      return;
    }

    // Room events
    socket.on(SOCKET_EVENTS.BROADCAST.ROOM_CREATED, handleRoomCreated);
    socket.on(SOCKET_EVENTS.BROADCAST.ROOM_LIST_UPDATED, handleRoomListChanged);
    socket.on(SOCKET_EVENTS.BROADCAST.ROOM_ENDED, handleRoomEnded);

    // Legacy meeting events (for backward compatibility)
    socket.on(SOCKET_EVENTS.BROADCAST.MEETING_CREATED, handleRoomCreated);
    socket.on(
      SOCKET_EVENTS.BROADCAST.MEETING_LIST_UPDATED,
      handleRoomListChanged
    );
    socket.on(
      SOCKET_EVENTS.BROADCAST.MEETING_LIST_CHANGED,
      handleRoomListChanged
    );
    socket.on(SOCKET_EVENTS.BROADCAST.MEETING_ENDED, handleRoomEnded);

    // Participant events
    socket.on(
      SOCKET_EVENTS.BROADCAST.PARTICIPANT_JOINED,
      handleParticipantJoined
    );
    socket.on(SOCKET_EVENTS.BROADCAST.PARTICIPANT_LEFT, handleParticipantLeft);
    socket.on(
      SOCKET_EVENTS.BROADCAST.PARTICIPANT_STATUS_UPDATED,
      handleParticipantStatusUpdated
    );
    socket.on(SOCKET_EVENTS.BROADCAST.HOST_TRANSFERRED, handleHostTransferred);

    // Custom room update event (you might need to add this to your backend)
    socket.on("room:updated", handleRoomUpdated);
    socket.on("room:deleted", handleRoomDeleted);

    // Cleanup function
    return () => {
      socket.off(SOCKET_EVENTS.BROADCAST.ROOM_CREATED, handleRoomCreated);
      socket.off(
        SOCKET_EVENTS.BROADCAST.ROOM_LIST_UPDATED,
        handleRoomListChanged
      );
      socket.off(SOCKET_EVENTS.BROADCAST.ROOM_ENDED, handleRoomEnded);

      socket.off(SOCKET_EVENTS.BROADCAST.MEETING_CREATED, handleRoomCreated);
      socket.off(
        SOCKET_EVENTS.BROADCAST.MEETING_LIST_UPDATED,
        handleRoomListChanged
      );
      socket.off(
        SOCKET_EVENTS.BROADCAST.MEETING_LIST_CHANGED,
        handleRoomListChanged
      );
      socket.off(SOCKET_EVENTS.BROADCAST.MEETING_ENDED, handleRoomEnded);

      socket.off(
        SOCKET_EVENTS.BROADCAST.PARTICIPANT_JOINED,
        handleParticipantJoined
      );
      socket.off(
        SOCKET_EVENTS.BROADCAST.PARTICIPANT_LEFT,
        handleParticipantLeft
      );
      socket.off(
        SOCKET_EVENTS.BROADCAST.PARTICIPANT_STATUS_UPDATED,
        handleParticipantStatusUpdated
      );
      socket.off(
        SOCKET_EVENTS.BROADCAST.HOST_TRANSFERRED,
        handleHostTransferred
      );

      socket.off("room:updated", handleRoomUpdated);
      socket.off("room:deleted", handleRoomDeleted);
    };
  }, [
    socket,
    handleRoomCreated,
    handleRoomUpdated,
    handleRoomDeleted,
    handleRoomListChanged,
    handleRoomEnded,
    handleParticipantJoined,
    handleParticipantLeft,
    handleParticipantStatusUpdated,
    handleHostTransferred,
  ]);
};

// Helper hook for just listening to room list changes
export const useRoomListEvents = (
  onRoomListChanged: (rooms: MeetingSummary[]) => void
) => {
  useRoomEvents({
    onRoomListChanged,
  });
};

// Helper hook for listening to specific room events
export const useRoomEvent = (
  eventType: "created" | "updated" | "deleted" | "ended",
  callback: (data: any) => void
) => {
  const handlers: RoomEventHandlers = {};

  switch (eventType) {
    case "created":
      handlers.onRoomCreated = callback;
      break;
    case "updated":
      handlers.onRoomUpdated = callback;
      break;
    case "deleted":
      handlers.onRoomDeleted = callback;
      break;
    case "ended":
      handlers.onRoomEnded = callback;
      break;
  }

  useRoomEvents(handlers);
};
