"use client";

import { MeetingSummary } from "@/types";
import { useState } from "react";

interface MeetingCardProps {
  room: MeetingSummary;
}

const MeetingCard = ({ room }: MeetingCardProps) => {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinMeeting = () => {
    setIsJoining(true);
    // Open meeting room in a new tab
    window.open(`/meeting/${room.code}`, "_blank");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getParticipantStatus = () => {
    const participantCount = room.participantCount || 0;
    if (participantCount >= room.options.maxParticipants) {
      return "Full";
    }
    return `${participantCount}/${room.options.maxParticipants}`;
  };

  const isRoomFull =
    (room.participantCount || 0) >= room.options.maxParticipants;

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3 line-clamp-2 text-gray-900 dark:text-white">
              {room.title}
            </h3>
            <p className="text-sm mb-4 line-clamp-2 text-gray-600 dark:text-gray-300">
              {room.description}
            </p>
          </div>
          {/* {room.isPrivate && (
            <div className="ml-3 flex-shrink-0">
              <span className="bg-orange-300 text-white rounded-sm px-3 py-1 text-xs font-medium cursor-pointer ">
                Private
              </span>
            </div>
          )} */}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="font-medium">{room.host}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span>{getParticipantStatus()} participants</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"
                />
              </svg>
            </div>
            <span>{room.status}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
            </div>
            <span>Code: {room.code}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span>{formatDate(room.createdAt || room?.startedAt)}</span>
          </div>
        </div>

        {/* {room.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {room.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-black text-white border-2 border-black rounded-xl px-3 py-1 text-xs font-medium "
                >
                  {tag}
                </span>
              ))}
              {room.tags.length > 3 && (
                <span className="bg-black text-white border-2 border-black rounded-xl px-3 py-1 text-xs font-medium cursor-pointer hover:bg-white hover:text-black transition-all duration-300 ease-out">
                  +{room.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )} */}

        <div className="flex items-center justify-between">
          <button
            onClick={handleJoinMeeting}
            disabled={isJoining || isRoomFull}
            className={`bg-white cursor-pointer text-black border-2 border-black rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white transition-all duration-300 ease-out flex items-center space-x-2 ${
              isRoomFull || isJoining ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isJoining ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Joining...</span>
              </>
            ) : isRoomFull ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                  />
                </svg>
                <span>Room Full</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Join Meeting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;
