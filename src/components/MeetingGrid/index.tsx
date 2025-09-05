"use client";

import { VideoRoom } from "@/types";
import MeetingCard from "../MeetingCard";

interface MeetingGridProps {
  rooms: VideoRoom[];
  isLoading?: boolean;
}

const MeetingGrid = ({ rooms, isLoading }: MeetingGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm animate-pulse"
          >
            <div className="p-6">
              <div className="h-6 mb-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="h-4 mb-2 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="h-4 mb-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </div>
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          No active meetings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          There are currently no active meetings. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <MeetingCard key={room.id} room={room} />
      ))}
    </div>
  );
};

export default MeetingGrid;
