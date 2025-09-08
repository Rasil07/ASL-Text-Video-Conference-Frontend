"use client";

import { useState } from "react";

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
  isHost?: boolean;
}

export default function MeetingControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeaveMeeting,
  onEndMeeting,
  isHost = false,
}: MeetingControlsProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const ControlButton = ({
    onClick,
    isActive,
    icon,
    label,
    isDanger = false,
    className = "",
  }: {
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    label: string;
    isDanger?: boolean;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-full transition-all duration-200
        ${
          isActive
            ? "bg-white text-black"
            : isDanger
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-gray-700 text-white hover:bg-gray-600"
        }
        ${className}
      `}
      title={label}
    >
      {icon}
      <span className="text-xs mt-1 hidden sm:block">{label}</span>
    </button>
  );

  return (
    <div className="relative">
      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 bg-gray-900 rounded-full px-6 py-3 shadow-lg">
        {/* Audio Toggle */}
        <ControlButton
          onClick={onToggleAudio}
          isActive={isAudioEnabled}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              {isAudioEnabled ? (
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          }
          label={isAudioEnabled ? "Mute" : "Unmute"}
        />

        {/* Video Toggle */}
        <ControlButton
          onClick={onToggleVideo}
          isActive={isVideoEnabled}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              {isVideoEnabled ? (
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          }
          label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        />

        {/* Screen Share Toggle */}
        <ControlButton
          onClick={onToggleScreenShare}
          isActive={isScreenSharing}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-2 0V5H5v10h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm10 4a1 1 0 011-1h3a1 1 0 011 1v6a1 1 0 01-1 1h-3a1 1 0 01-1-1V8zm2 1v4h1V9h-1z"
                clipRule="evenodd"
              />
            </svg>
          }
          label={isScreenSharing ? "Stop sharing" : "Share screen"}
        />

        {/* Chat Toggle */}
        <ControlButton
          onClick={onToggleChat}
          isActive={isChatOpen}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          }
          label="Chat"
        />

        {/* Participants Toggle */}
        <ControlButton
          onClick={onToggleParticipants}
          isActive={isParticipantsOpen}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          }
          label="Participants"
        />

        {/* More Options */}
        <ControlButton
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          isActive={showMoreOptions}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          }
          label="More options"
        />

        {/* Leave/End Meeting */}
        <ControlButton
          onClick={isHost ? onEndMeeting || onLeaveMeeting : onLeaveMeeting}
          isActive={false}
          isDanger={true}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
          }
          label={isHost ? "End meeting" : "Leave meeting"}
        />
      </div>

      {/* More Options Dropdown */}
      {showMoreOptions && (
        <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[200px]">
          <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Settings</span>
            </div>
          </button>
          <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Record meeting</span>
            </div>
          </button>
          <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-2 0V5H5v10h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm10 4a1 1 0 011-1h3a1 1 0 011 1v6a1 1 0 01-1 1h-3a1 1 0 01-1-1V8zm2 1v4h1V9h-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Whiteboard</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
