import api from "./axios";
import { VideoRoom, CreateRoomFormData } from "@/types";
import { mockRooms } from "@/data/mockRooms";

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

export const createMeeting = async (
  meetingData: CreateRoomFormData
): Promise<VideoRoom> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create a new mock meeting
    const newMeeting: VideoRoom = {
      id: `mock-${Date.now()}`,
      title: meetingData.title,
      description: meetingData.description,
      hostName: "You", // In real app, this would come from user context
      isActive: true,
      participantCount: 1,
      maxParticipants: meetingData.maxParticipants,
      category: meetingData.category,
      tags: [],
      createdAt: new Date(),
      lastActive: new Date(),
      meetingId: `meeting-${Date.now()}`,
      isPrivate: meetingData.isPrivate,
      recordingEnabled: meetingData.recordingEnabled,
    };

    return newMeeting;
  }

  const response = await api.post("/meetings", meetingData);
  return response.data;
};

export const joinMeeting = async (
  meetingId: string
): Promise<{ roomUrl: string }> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return a mock room URL
    return {
      roomUrl: `https://meet.example.com/room/${meetingId}`,
    };
  }

  const response = await api.post(`/meetings/${meetingId}/join`);
  return response.data;
};

export const getMeetingById = async (meetingId: string): Promise<VideoRoom> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const meeting = mockRooms.find((room) => room.id === meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    return meeting;
  }

  const response = await api.get(`/meetings/${meetingId}`);
  return response.data;
};
