"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
// import { useRoomJoin } from "@/hooks/useRoomJoin";
// import MeetingRoom from "@/components/Meeting/MeetingRoom";
import SFUClient, { ProducerSummary } from "@/lib/sfu";
import { IRoom } from "@/types";
import SOCKET_EVENTS from "@/config/socket_events";
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
  socketId: string;
}

export default function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    {
      stream: MediaStream;
      peerId: string;
      peerName: string;
      kind: "audio" | "video";
    }[]
  >([]);
  const { user, logout } = useAuth();
  // { stream, peerId, peerName, kind }]
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Set up room event listeners
  useRoomEvents({
    onParticipantJoined: (data) => {
      console.log("Participant joined:", data);

      const newParticipant: Participant = {
        id: data.participant.userId,
        name: data.participant.name,
        isVideoEnabled: data.participant.isVideoEnabled || true,
        isAudioEnabled: data.participant.isAudioEnabled || true,
        isSpeaking: false,
        isHost: data.participant.isHost || false,
        isMuted: !data.participant.isAudioEnabled,
        joinedAt: new Date(),
        socketId: data.participant.socketId,
      };

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === newParticipant.id);
        if (exists) return prev;
        return [...prev, newParticipant];
      });
    },

    onParticipantLeft: (data) => {
      console.log("Participant left:", data);
      setParticipants((prev) => {
        const leftParticipant = prev.find((p) => p.id === data.participantId);
        if (leftParticipant) {
          console.log("Removing participant:", leftParticipant.name);
        }
        return prev.filter((p) => p.id !== data.participantId);
      });

      // Clean up streams for the left participant
      setRemoteStreams((prev) => {
        return prev.filter(
          (streamData) => streamData.peerId !== data.participantId
        );
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

  const [room, setRoom] = useState<IRoom | null>(null);

  const roomCode = useMemo(
    () => (Array.isArray(code) ? code[0] : code),
    [code]
  );

  const sfuRef = useRef<SFUClient | null>(null);
  const hasJoinedRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!roomCode || isLoading || hasJoinedRef.current || !user) return;

    console.log("Use effect room code ==>", roomCode);

    setIsLoading(true);
    hasJoinedRef.current = true;

    (async () => {
      try {
        sfuRef.current = new SFUClient(roomCode);
        const roomDetails = await sfuRef.current.joinRoom({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
        });

        console.log("Join room response ==>", roomDetails);

        if (roomDetails && roomDetails.room) {
          setRoom(roomDetails.room);
          console.log("Room details:", roomDetails);
          console.log("Existing producers:", roomDetails.producers);

          // Add current user to participants list
          const currentUserParticipant: Participant = {
            id: user.id,
            name: user.name,
            isVideoEnabled: true,
            isAudioEnabled: true,
            isSpeaking: false,
            isHost: roomDetails.room.host === user.id,
            isMuted: false,
            joinedAt: new Date(),
            socketId: sfuRef.current?.socket.id || "",
          };
          setParticipants([currentUserParticipant]);
        } else {
          console.error("Failed to join room:", roomDetails);
          hasJoinedRef.current = false;
          setIsLoading(false);
          return;
        }

        // Get user media
        console.log("Requesting user media...");
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
            frameRate: { ideal: 30, max: 30 },
          },
          audio: true,
        });

        console.log("Local stream obtained:", localStream);
        console.log("Video tracks:", localStream.getVideoTracks());
        console.log("Audio tracks:", localStream.getAudioTracks());

        // Check if video track is enabled
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          console.log("Video track enabled:", videoTrack.enabled);
          console.log("Video track readyState:", videoTrack.readyState);
          console.log("Video track settings:", videoTrack.getSettings());
        }

        // Set up local video
        if (localVideoRef.current) {
          console.log("Setting up local video element...");
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = false; // Mute to avoid echo

          // Add event listeners for debugging
          localVideoRef.current.addEventListener("loadedmetadata", () => {
            console.log("Video metadata loaded");
          });

          localVideoRef.current.addEventListener("canplay", () => {
            console.log("Video can play");
          });

          localVideoRef.current.addEventListener("error", (e) => {
            console.error("Video error:", e);
          });

          try {
            await localVideoRef.current.play();
            console.log("Local video started playing");
          } catch (err) {
            console.error("Error playing local video:", err);
          }
        } else {
          console.error("localVideoRef.current is null!");
        }

        // Publish the stream
        await sfuRef.current.publish(localStream);
        console.log("Published local stream");

        // Consume existing producers (other users already in the room)
        if (roomDetails.producers?.length) {
          console.log("Consuming existing producers:", roomDetails.producers);
          for (const producer of roomDetails.producers) {
            try {
              const result = await sfuRef.current!.consume(producer);
              console.log("Consumed existing producer:", result);
              setRemoteStreams((prev) =>
                prev.find((s) => s.stream.id === result.stream.id)
                  ? prev
                  : [...prev, result]
              );
            } catch (err) {
              console.error("Error consuming existing producer:", err);
            }
          }
        }

        // Set up listener for new producers (other users joining)
        const handleNewProducer = async ({
          producer,
        }: {
          producer: ProducerSummary;
        }) => {
          console.log("New producer detected:", producer);
          try {
            const result = await sfuRef.current!.consume(producer);
            console.log("Consumed remote stream:", result);
            setRemoteStreams((prev) => {
              // Check if stream already exists to avoid duplicates
              const exists = prev.some(
                (existingStream) =>
                  existingStream.stream.id === result.stream.id
              );
              if (exists) return prev;
              return [...prev, result];
            });
          } catch (error) {
            console.error("Error consuming producer:", error);
          }
        };

        // Remove any existing listeners to avoid duplicates
        sfuRef.current.socket.off(SOCKET_EVENTS.ROOM.NEW_PRODUCER);
        sfuRef.current.socket.on(
          SOCKET_EVENTS.ROOM.NEW_PRODUCER,
          handleNewProducer
        );

        // listener for producerClosed
        sfuRef.current.socket.on(
          SOCKET_EVENTS.ROOM.PRODUCER_CLOSED,
          ({ producerId }) => {
            console.log("Producer closed:", producerId);
            const stream = sfuRef.current?.getStreamByProducerId(producerId);
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
              setRemoteStreams((prev) =>
                prev.filter((s) => s.stream !== stream)
              );
            }
          }
        );

        console.log("Set up NEW_PRODUCER listener");
      } catch (error) {
        console.error("Error joining room:", error);
        hasJoinedRef.current = false; // Allow retry on error
      } finally {
        setIsLoading(false);
      }
    })();
  }, [roomCode, user?.id, isLoading, user]); // Include user to satisfy linter

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sfuRef.current) {
        console.log("Cleaning up SFU client");
        // Stop all tracks in remote streams
        remoteStreams.forEach((stream) => {
          stream.stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
        // Stop local stream - capture ref value to avoid stale closure
        const localVideoElement = localVideoRef.current;
        if (localVideoElement && localVideoElement.srcObject) {
          const localStream = localVideoElement.srcObject as MediaStream;
          localStream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      }
    };
  }, [remoteStreams]);

  console.log("room ==>", room);
  console.log({ user });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4" />
          <div className="text-lg">Joining meeting room...</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Verifying access and connecting...
          </div>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to sign in to join this meeting room.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => logout()}
              className="bg-black text-white border-2 border-black rounded-md px-6 py-3 hover:bg-white hover:text-black transition-all duration-300 ease-out"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-black border-2 border-gray-200 dark:border-gray-700 rounded-md px-6 py-3 hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Room join failed or no room data
  if (!room) {
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
            Failed to Join Room
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Unable to join the meeting room. Please check the room code and try
            again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                hasJoinedRef.current = false;
                setIsLoading(true);
              }}
              className="bg-black text-white border-2 border-black rounded-md px-6 py-3 hover:bg-white hover:text-black transition-all duration-300 ease-out"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-black border-2 border-gray-200 dark:border-gray-700 rounded-md px-6 py-3 hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("remoteStreams ==>", remoteStreams);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meeting Room: {roomCode}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""}({remoteStreams.length + 1}{" "}
            video stream{remoteStreams.length + 1 !== 1 ? "s" : ""})
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Local Video */}
          <div className="relative bg-black rounded-xl overflow-hidden">
            <video
              ref={localVideoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-64 object-cover"
              style={{ backgroundColor: "#000" }}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You
            </div>
            {/* Debug overlay */}
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              {localVideoRef.current?.srcObject ? "Stream: ✓" : "Stream: ✗"}
            </div>
          </div>

          {/* Remote Videos */}
          {remoteStreams
            .filter((m) => m.kind === "video")
            .map((m, i) => (
              <div
                key={m.stream.id}
                className="relative bg-black rounded-xl overflow-hidden"
              >
                <video
                  playsInline
                  autoPlay
                  ref={(el) => {
                    if (el && !el.srcObject) {
                      el.srcObject = m.stream;
                      el.play().catch((err) =>
                        console.error("Error playing remote video:", err)
                      );
                    }
                  }}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {m.peerName}
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={async () => {
            try {
              console.log("Testing camera access...");
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
              console.log("Camera test successful:", stream);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play();
              }
            } catch (error) {
              console.error("Camera test failed:", error);
              alert(
                `Camera access failed: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Camera
        </button>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Debug Info
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>Room Code: {roomCode}</p>
            <p>
              User: {user?.name} ({user?.email})
            </p>
            <p>Participants: {participants.length}</p>
            <p>Remote Streams: {remoteStreams.length}</p>
            <p>
              Local Video Element:{" "}
              {localVideoRef.current ? "Connected" : "Not connected"}
            </p>
            <p>
              SFU Client: {sfuRef.current ? "Initialized" : "Not initialized"}
            </p>
            <p>
              Video Stream:{" "}
              {localVideoRef.current?.srcObject ? "Active" : "No stream"}
            </p>
            <p>Socket ID: {sfuRef.current?.socket.id || "Not connected"}</p>
            <div className="mt-2">
              <p className="font-semibold">
                Participants ({participants.length}):
              </p>
              {participants.map((p) => (
                <p key={p.id} className="text-xs ml-2">
                  • {p.name} {p.isHost ? "(Host)" : ""} - {p.socketId}
                </p>
              ))}
            </div>
            <div className="mt-2">
              <p className="font-semibold">
                Remote Streams ({remoteStreams.length}):
              </p>
              {remoteStreams.map((s) => (
                <p key={s.stream.id} className="text-xs ml-2">
                  • {s.peerName} ({s.kind}) - {s.stream.id}
                </p>
              ))}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                try {
                  console.log("Testing camera access...");
                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                  });
                  console.log("Camera test successful:", stream);
                  if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    await localVideoRef.current.play();
                  }
                } catch (error) {
                  console.error("Camera test failed:", error);
                  alert(
                    `Camera access failed: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`
                  );
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Camera
            </button>

            <button
              onClick={() => {
                console.log("Manual NEW_PRODUCER test");
                // Simulate a NEW_PRODUCER event for testing
                const testProducerId = `test-producer-${Date.now()}`;
                console.log(
                  "Simulating NEW_PRODUCER event with ID:",
                  testProducerId
                );
                // This would normally be triggered by the server
                alert("Check console for simulated NEW_PRODUCER event");
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test NEW_PRODUCER
            </button>

            <button
              onClick={() => {
                console.log("Current state:");
                console.log("- Participants:", participants);
                console.log("- Remote Streams:", remoteStreams);
                console.log("- SFU Client:", sfuRef.current);
                console.log("- Socket ID:", sfuRef.current?.socket.id);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Log State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
