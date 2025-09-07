"use client";

import { useRoomEvents } from "@/hooks/useRoomEvents";
import { useRooms } from "@/hooks/useRooms";
import { MeetingSummary } from "@/types";

export default function RoomEventDemo() {
  const { rooms } = useRooms();

  // Example of listening to specific room events
  useRoomEvents({
    onRoomCreated: (room: MeetingSummary) => {
      console.log("🎉 New room created:", room.title);
      // You could show a toast notification here
      // toast.success(`New room "${room.title}" has been created!`);
    },

    onRoomUpdated: (room: MeetingSummary) => {
      console.log("📝 Room updated:", room.title);
      // You could show a toast notification here
      // toast.info(`Room "${room.title}" has been updated!`);
    },

    onRoomDeleted: (roomId: string) => {
      console.log("🗑️ Room deleted:", roomId);
      // You could show a toast notification here
      // toast.warning("A room has been deleted!");
    },

    onRoomEnded: (roomId: string) => {
      console.log("🏁 Room ended:", roomId);
      // You could show a toast notification here
      // toast.info("A room has ended!");
    },

    onParticipantJoined: (data) => {
      console.log("👋 Participant joined room:", data.code);
      // You could show a toast notification here
      // toast.success("Someone joined the room!");
    },

    onParticipantLeft: (data) => {
      console.log("👋 Participant left room:", data.code);
      // You could show a toast notification here
      // toast.info("Someone left the room!");
    },
  });

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Room Events Demo</h3>
      <p className="text-sm text-gray-600 mb-4">
        Open the browser console to see real-time room events. Current rooms:{" "}
        {rooms.length}
      </p>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          📡 Listening for: room:created, room:updated, room:deleted,
          room:ended, participant events
        </div>
        <div className="text-xs text-gray-500">
          🔄 Auto-updating room list with {rooms.length} rooms
        </div>
      </div>
    </div>
  );
}
