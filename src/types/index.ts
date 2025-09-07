export type RoomStatus = "ongoing" | "ended" | "cancelled";

// Backend-aligned Room interface
export interface IRoom {
  _id: string;
  title: string;
  description?: string;
  host: string; // ObjectId reference to User
  code: string; // 6-8 character unique join code
  status: RoomStatus;
  startedAt?: Date;
  endedAt?: Date;
  options: {
    maxParticipants: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Frontend display interface with additional computed fields
export interface VideoRoom extends IRoom {
  hostName: string; // Populated host name for display
  participantCount: number; // Current participant count
  isActive: boolean; // Computed from status === "ongoing"
}

export interface RoomCardProps {
  room: VideoRoom;
  onJoin: (roomId: string) => void;
}

export interface RoomGridProps {
  rooms: VideoRoom[];
  onJoinRoom: (roomId: string) => void;
}

export interface CreateRoomFormData {
  title: string;
  description?: string;
  maxParticipants: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// MeetingSummary for Socket.IO events
export interface MeetingSummary {
  _id: string;
  title: string;
  description?: string;
  host: string;
  code: string;
  status: RoomStatus;
  startedAt?: Date;
  endedAt?: Date;
  options: {
    maxParticipants: number;
  };
  createdAt: Date;
  updatedAt: Date;

  participantCount?: number; // Current count
}
