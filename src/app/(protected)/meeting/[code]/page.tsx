"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketConnection } from "@/contexts/SocketContext";
import { getRoomByCode } from "@/api/meetings";
import { IRoom } from "@/types";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { connected, isClient } = useSocketConnection();

  const [room, setRoom] = useState<IRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  const roomCode = params.code as string;

  useEffect(() => {
    if (!isClient || !roomCode) return;

    const fetchRoom = async () => {
      try {
        setIsLoading(true);
        const roomData = await getRoomByCode(roomCode);
        setRoom(roomData);
        setError(null);
      } catch (err) {
        setError("Room not found or you don't have access to it");
        console.error("Failed to fetch room:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [isClient, roomCode]);

  const handleLeaveMeeting = () => {
    // TODO: Implement leave meeting logic
    // Check if this is a popup window or main window
    if (window.opener) {
      // This is a popup window, close it
      window.close();
    } else {
      // This is the main window, navigate back
      router.push("/dashboard");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <div className="text-lg">Loading meeting room...</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Room Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error ||
              "The meeting room you're looking for doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                router.push("/dashboard");
              }
            }}
            className="bg-black text-white border-2 border-black rounded-md px-6 py-3 hover:bg-white hover:text-black transition-all duration-300 ease-out"
          >
            {window.opener ? "Close Window" : "Back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push("/dashboard");
                  }
                }}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>
                  {window.opener ? "Close Meeting" : "Back to Dashboard"}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {connected ? "Live" : "Offline"}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome, <span className="font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Info */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {room.title}
              </h1>
              {room.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {room.description}
                </p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
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
                  <span>
                    Room Code:{" "}
                    <span className="font-mono font-bold">{room.code}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
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
                  <span>
                    {participants.length}/{room.options.maxParticipants}{" "}
                    participants
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      room.status === "ongoing" ? "bg-green-500" : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="capitalize">{room.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Conference Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-gray-500"
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
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Video Conference
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Video functionality will be implemented here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Participants
              </h3>
              <div className="space-y-3">
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    No participants yet
                  </p>
                ) : (
                  participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 rounded-md bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {participant.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {participant}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Controls
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleLeaveMeeting}
                  className="w-full bg-red-600 text-white border-2 border-red-600 rounded-md px-4 py-2 hover:bg-white hover:text-red-600 transition-all duration-300 ease-out"
                >
                  Leave Meeting
                </button>
                <button className="w-full bg-black text-white border-2 border-black rounded-md px-4 py-2 hover:bg-white hover:text-black transition-all duration-300 ease-out">
                  Share Room Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
