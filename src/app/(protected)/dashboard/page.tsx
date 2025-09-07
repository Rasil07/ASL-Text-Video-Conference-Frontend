"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import MeetingGrid from "@/components/MeetingGrid";
import CreateMeetingForm from "@/components/CreateMeetingForm";
import { useSocketConnection } from "@/contexts/SocketContext";
import { useRooms } from "@/hooks/useRooms";

import { IRoom } from "@/types";

export default function Dashboard() {
  const { logout, user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use the new room management hook with real-time updates
  const { rooms: meetings, isLoading, error, refetch } = useRooms();

  const { connected, isClient } = useSocketConnection();

  const handleLogout = () => {
    logout();
  };

  const handleCreateSuccess = (data: { success: boolean; room: IRoom }) => {
    setShowCreateForm(false);

    console.log("new room created data ==>", data);
    // Open meeting room in a new tab
    window.open(`/meeting/${data?.room?.code}`, "_blank");
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  console.log("meetings ==>", { meetings, isLoading });

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={handleCreateCancel}
              className="bg-white text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out flex items-center space-x-2"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <CreateMeetingForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b-2 border-gray-200 dark:border-gray-700 py-6 mb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ASL Video Conference
              </h1>
              <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                Welcome back, {user?.name || "User"}!
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-white text-black border-2 border-black rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white transition-all duration-300 ease-out flex items-center space-x-2"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create Meeting</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-white text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out flex items-center space-x-2"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                  Active Meetings
                </h2>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isClient && connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isClient && connected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>
              <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                {isClient && connected
                  ? "Real-time updates enabled - Join ongoing conversations and learning sessions"
                  : "Join ongoing conversations and learning sessions"}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="bg-white text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out flex items-center space-x-2"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
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
              <span>Refresh</span>
            </button>
          </div>

          {error && (
            <div className="bg-white dark:bg-gray-900 border-2 border-red-500 rounded-md p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-500">
                    Error loading meetings
                  </h3>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                    Failed to load active meetings. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <MeetingGrid rooms={meetings || []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
