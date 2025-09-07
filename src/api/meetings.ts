"use client";

import api from "./axios";
import { VideoRoom, CreateRoomFormData, IRoom, MeetingSummary } from "@/types";
import { emitWithAck, getSocket } from "@/lib/socket";

import { mockRooms } from "@/data/mockRooms";
import { SOCKET_EVENTS } from "@/config/socket_events";

// For development, we'll use mock data. In production, these would call the actual API
const USE_MOCK_DATA = true;

export const getActiveMeetings = async (): Promise<VideoRoom[]> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Return only active meetings
    return mockRooms.filter((room) => room.isActive);
  }

  const response = await api.get("/meetings/active");
  return response.data;
};

export const joinMeeting = async (
  roomCode: string
): Promise<{ roomUrl: string }> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return a mock room URL using room code
    return {
      roomUrl: `https://meet.example.com/room/${roomCode}`,
    };
  }

  const response = await api.post(`/rooms/${roomCode}/join`);
  return response.data;
};

export const getRoomByCode = async (roomCode: string): Promise<IRoom> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const room = mockRooms.find((room) => room.code === roomCode);
    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }

  const response = await api.get(`/rooms/code/${roomCode}`);
  return response.data;
};

// Remove the old MeetingSummary type since it's now defined in types/index.ts

export async function listMeetings(): Promise<{
  rooms: MeetingSummary[];
  success: boolean;
}> {
  // Only make Socket.IO calls on client side
  if (typeof window === "undefined") {
    return { rooms: [], success: false };
  }
  return emitWithAck<{ rooms: MeetingSummary[]; success: boolean }>(
    SOCKET_EVENTS.ROOM.LIST
  );
}

export const createMeeting = async (
  meetingData: CreateRoomFormData
): Promise<{ success: boolean; room: IRoom }> => {
  return emitWithAck<{ success: boolean; room: IRoom }>(
    SOCKET_EVENTS.ROOM.CREATE,
    meetingData
  );
};

export function onMeetingListChanged(cb: (m: MeetingSummary[]) => void) {
  // Only set up listeners on client side
  if (typeof window === "undefined") {
    return () => {};
  }
  const s = getSocket();
  s.on(SOCKET_EVENTS.ROOM.LIST_CHANGED, cb);
  return () => s.off(SOCKET_EVENTS.ROOM.LIST_CHANGED, cb);
}

export function onMeetingCreated(cb: (m: MeetingSummary) => void) {
  // Only set up listeners on client side
  if (typeof window === "undefined") {
    return () => {};
  }
  const s = getSocket();
  s.on(SOCKET_EVENTS.ROOM.CREATE, cb);
  return () => s.off(SOCKET_EVENTS.ROOM.CREATE, cb);
}
