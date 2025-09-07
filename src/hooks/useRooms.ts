"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoomEvents } from "./useRoomEvents";
import { listMeetings } from "@/api/meetings";
import { MeetingSummary } from "@/types";

const ROOMS_QUERY_KEY = ["rooms"];

export const useRooms = () => {
  const queryClient = useQueryClient();

  // Fetch rooms using React Query
  const {
    data: rooms = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: async () => {
      const response = await listMeetings();

      console.log("List meetings response ==>", response);
      return response?.rooms || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Set up socket event listeners to update the cache
  useRoomEvents({
    onRoomCreated: (newRoom: MeetingSummary) => {
      console.log("Adding new room to cache:", newRoom);

      // Optimistically add the new room to the cache
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          // Check if room already exists to avoid duplicates
          const exists = oldRooms.some((room) => room.code === newRoom.code);
          if (exists) {
            return oldRooms;
          }
          return [newRoom, ...oldRooms];
        }
      );
    },

    onRoomUpdated: (updatedRoom: MeetingSummary) => {
      console.log("Updating room in cache:", updatedRoom);

      // Update the specific room in the cache
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.map((room) =>
            room.code === updatedRoom.code ? updatedRoom : room
          );
        }
      );
    },

    onRoomDeleted: (roomId: string) => {
      console.log("Removing room from cache:", roomId);

      // Remove the room from the cache
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.filter((room) => room.code !== roomId);
        }
      );
    },

    onRoomListChanged: (newRooms: MeetingSummary[]) => {
      console.log("Room list changed, updating cache:", newRooms);

      // Replace the entire room list
      queryClient.setQueryData(ROOMS_QUERY_KEY, newRooms);
    },

    onRoomEnded: (roomId: string) => {
      console.log("Room ended, updating cache:", roomId);

      // Mark the room as ended (inactive)
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.map((room) =>
            room.code === roomId ? { ...room, isActive: false } : room
          );
        }
      );
    },

    onParticipantJoined: (data) => {
      console.log("Participant joined, updating room:", data);

      // Update participant count for the room
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.map((room) =>
            room.code === data.code
              ? { ...room, participantCount: (room.participantCount || 0) + 1 }
              : room
          );
        }
      );
    },

    onParticipantLeft: (data) => {
      console.log("Participant left, updating room:", data);

      // Update participant count for the room
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.map((room) =>
            room.code === data.code
              ? {
                  ...room,
                  participantCount: Math.max(
                    (room.participantCount || 0) - 1,
                    0
                  ),
                }
              : room
          );
        }
      );
    },
  });

  return {
    rooms,
    isLoading,
    error,
    refetch,
    // Helper functions
    invalidateRooms: () =>
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY }),
    updateRoom: (roomId: string, updates: Partial<MeetingSummary>) => {
      queryClient.setQueryData(
        ROOMS_QUERY_KEY,
        (oldRooms: MeetingSummary[] = []) => {
          return oldRooms.map((room) =>
            room.code === roomId ? { ...room, ...updates } : room
          );
        }
      );
    },
  };
};

// Hook for getting a specific room by ID
export const useRoom = (roomId: string) => {
  const { rooms } = useRooms();
  return rooms.find((room) => room.code === roomId);
};

// Hook for getting only active rooms
export const useActiveRooms = () => {
  const { rooms, isLoading, error, refetch } = useRooms();
  const activeRooms = rooms.filter((room) => room.status === "ongoing");

  return {
    rooms: activeRooms,
    isLoading,
    error,
    refetch,
  };
};
