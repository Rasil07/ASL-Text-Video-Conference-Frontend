"use client";

import { useState, useRef, useEffect } from "react";

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  avatar?: string;
}

interface VideoGridProps {
  participants: Participant[];
  currentUser: Participant;
  onParticipantClick?: (participant: Participant) => void;
}

export default function VideoGrid({
  participants,
  currentUser,
  onParticipantClick,
}: VideoGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedParticipant, setFocusedParticipant] =
    useState<Participant | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Calculate grid layout based on number of participants
  const getGridLayout = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  // Get grid item size based on participant count
  const getGridItemSize = (count: number) => {
    if (count <= 1) return "aspect-video";
    if (count <= 2) return "aspect-video";
    if (count <= 4) return "aspect-square";
    if (count <= 6) return "aspect-square";
    if (count <= 9) return "aspect-square";
    return "aspect-square";
  };

  const allParticipants = [
    currentUser,
    ...participants.filter((p) => p.id !== currentUser.id),
  ];
  const gridLayout = getGridLayout(allParticipants.length);
  const gridItemSize = getGridItemSize(allParticipants.length);

  const handleParticipantClick = (participant: Participant) => {
    if (onParticipantClick) {
      onParticipantClick(participant);
    }
    setFocusedParticipant(participant);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={`relative w-full h-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
    >
      {/* Video Grid */}
      <div className={`grid ${gridLayout} gap-2 h-full w-full p-2`}>
        {allParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`relative ${gridItemSize} bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
              participant.isSpeaking ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => handleParticipantClick(participant)}
          >
            {/* Video Element */}
            {participant.isVideoEnabled ? (
              <video
                ref={(el) => (videoRefs.current[participant.id] = el)}
                className="w-full h-full object-cover"
                autoPlay
                muted={participant.id === currentUser.id}
                playsInline
              />
            ) : (
              /* Avatar Placeholder */
              <div
                className={`w-full h-full flex items-center justify-center ${getAvatarColor(
                  participant.name
                )}`}
              >
                <span className="text-white text-2xl font-bold">
                  {getInitials(participant.name)}
                </span>
              </div>
            )}

            {/* Participant Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm font-medium truncate">
                    {participant.name}
                    {participant.id === currentUser.id && " (You)"}
                  </span>
                  {participant.isHost && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Host
                    </span>
                  )}
                </div>

                {/* Audio/Video Status Icons */}
                <div className="flex items-center space-x-1">
                  {!participant.isAudioEnabled && (
                    <div className="bg-red-500 p-1 rounded-full">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  {!participant.isVideoEnabled && (
                    <div className="bg-red-500 p-1 rounded-full">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Speaking Indicator */}
            {participant.isSpeaking && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Toggle */}
      <button
        onClick={handleFullscreen}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      {/* Participant Count */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {allParticipants.length} participant
        {allParticipants.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
