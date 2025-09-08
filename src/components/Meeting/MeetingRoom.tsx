"use client";

import { useState, useEffect } from "react";
import VideoGrid from "./VideoGrid";
import MeetingControls from "./MeetingControls";
import ParticipantList from "./ParticipantList";
import Chat from "./Chat";
import { useRoomEvents } from "@/hooks/useRoomEvents";

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isMuted: boolean;
  avatar?: string;
  joinedAt: Date;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isSystemMessage?: boolean;
}

interface MeetingRoomProps {
  roomCode: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    isHost: boolean;
  };
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
}

export default function MeetingRoom({
  roomCode,
  currentUser,
  onLeaveMeeting,
  onEndMeeting,
}: MeetingRoomProps) {
  // State management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Create current user participant object
  const currentUserParticipant: Participant = {
    id: currentUser.id,
    name: currentUser.name,
    isVideoEnabled,
    isAudioEnabled,
    isSpeaking: false,
    isHost: currentUser.isHost,
    isMuted: !isAudioEnabled,
    joinedAt: new Date(),
  };

  // Set up room event listeners
  useRoomEvents({
    onParticipantJoined: (data) => {
      console.log("Participant joined:", data);
      const newParticipant: Participant = {
        id: data.participant.id,
        name: data.participant.name,
        isVideoEnabled: data.participant.isVideoEnabled || true,
        isAudioEnabled: data.participant.isAudioEnabled || true,
        isSpeaking: false,
        isHost: data.participant.isHost || false,
        isMuted: !data.participant.isAudioEnabled,
        joinedAt: new Date(),
      };

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === newParticipant.id);
        if (exists) return prev;
        return [...prev, newParticipant];
      });

      // Add system message
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        senderId: "system",
        senderName: "System",
        content: `${data.participant.name} joined the meeting`,
        timestamp: new Date(),
        isSystemMessage: true,
      };
      setMessages((prev) => [...prev, systemMessage]);
    },

    onParticipantLeft: (data) => {
      console.log("Participant left:", data);
      setParticipants((prev) => {
        const leftParticipant = prev.find((p) => p.id === data.participantId);
        if (leftParticipant) {
          // Add system message
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            senderId: "system",
            senderName: "System",
            content: `${leftParticipant.name} left the meeting`,
            timestamp: new Date(),
            isSystemMessage: true,
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
        return prev.filter((p) => p.id !== data.participantId);
      });
    },

    onParticipantStatusUpdated: (data) => {
      console.log("Participant status updated:", data);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.participantId ? { ...p, ...data.status } : p
        )
      );
    },
  });

  // Control handlers
  const handleToggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // TODO: Implement actual audio toggle logic
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // TODO: Implement actual video toggle logic
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // TODO: Implement actual screen sharing logic
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleToggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    // TODO: Send message via socket
  };

  const handleMuteParticipant = (participantId: string) => {
    // TODO: Implement mute participant logic
    console.log("Mute participant:", participantId);
  };

  const handleRemoveParticipant = (participantId: string) => {
    // TODO: Implement remove participant logic
    console.log("Remove participant:", participantId);
  };

  const handleMakeHost = (participantId: string) => {
    // TODO: Implement make host logic
    console.log("Make host:", participantId);
  };

  // Initialize with current user
  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: `system-${Date.now()}`,
      senderId: "system",
      senderName: "System",
      content: `Welcome to the meeting! Room code: ${roomCode}`,
      timestamp: new Date(),
      isSystemMessage: true,
    };
    setMessages([welcomeMessage]);
  }, [roomCode]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Video Grid - Main Area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isChatOpen || isParticipantsOpen ? "lg:w-2/3" : "w-full"
          }`}
        >
          <VideoGrid
            participants={participants}
            currentUser={currentUserParticipant}
            onParticipantClick={(participant) => {
              console.log("Participant clicked:", participant);
            }}
          />
        </div>

        {/* Sidebar - Chat and Participants */}
        {(isChatOpen || isParticipantsOpen) && (
          <div className="w-full lg:w-1/3 border-l-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {isChatOpen && (
              <Chat
                messages={messages}
                currentUserId={currentUser.id}
                onSendMessage={handleSendMessage}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
              />
            )}
            {isParticipantsOpen && (
              <ParticipantList
                participants={participants}
                currentUser={currentUserParticipant}
                onMuteParticipant={handleMuteParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                onMakeHost={handleMakeHost}
                isHost={currentUser.isHost}
              />
            )}
          </div>
        )}
      </div>

      {/* Meeting Controls */}
      <div className="bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-center">
          <MeetingControls
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleChat={handleToggleChat}
            onToggleParticipants={handleToggleParticipants}
            onLeaveMeeting={onLeaveMeeting}
            onEndMeeting={onEndMeeting}
            isHost={currentUser.isHost}
          />
        </div>
      </div>
    </div>
  );
}
