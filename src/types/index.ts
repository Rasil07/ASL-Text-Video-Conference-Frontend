export interface VideoRoom {
  id: string;
  title: string;
  description: string;
  hostName: string;
  isActive: boolean;
  participantCount: number;
  maxParticipants: number;
  thumbnail?: string;
  category: string;
  tags: string[];
  createdAt: Date;
  lastActive: Date;
  meetingId: string;
  isPrivate: boolean;
  recordingEnabled: boolean;
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
  description: string;
  category: string;
  isPrivate: boolean;
  maxParticipants: number;
  recordingEnabled: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
