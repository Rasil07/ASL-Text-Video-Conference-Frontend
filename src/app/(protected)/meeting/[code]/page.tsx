"use client";

import { useParams, useRouter } from "next/navigation";

import { useEffect, useMemo, useRef } from "react";

// import { useRoomJoin } from "@/hooks/useRoomJoin";
import { useAuth } from "@/contexts/AuthContext";
import { useMeetingRoom } from "@/hooks/useMeetingRoom";
import VideoTile from "@/components/Meeting/VideoTile";

export type ID = string;
export type MediaKind = "audio" | "video";
type RemoteTile = {
  peerId: string;
  stream: MediaStream;

  kind: MediaKind;

  producerId: ID;
  consumerId: ID;
  userName?: string;
  userEmail?: string;
};

function AudioSink({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function mergeStreamsByPeer(tiles: RemoteTile[]) {
  // Returns [{ peerId, stream: MediaStream(with audio+video if available) }]
  const map = new Map<string, MediaStream>();

  for (const t of tiles) {
    let m = map.get(t.peerId);
    if (!m) {
      m = new MediaStream();
      map.set(t.peerId, m);
    }
    // Add any new tracks from the incoming stream into the merged one
    t.stream.getTracks().forEach((track) => {
      const already = m!.getTracks().some((tr) => tr.id === track.id);
      if (!already) m!.addTrack(track);
    });
  }

  return Array.from(map.entries()).map(([peerId, stream]) => ({
    peerId,
    stream,
  }));
}

const Page = () => {
  const { code } = useParams<{ code: string }>();
  // const router = useRouter();

  // const { logout } = useAuth();

  const { status, error, localStream, remoteTiles, client } = useMeetingRoom({
    code,
  });
  // Consolidate audio+video per peer
  const mergedPeers = useMemo(
    () => mergeStreamsByPeer(remoteTiles as RemoteTile[]),
    [remoteTiles]
  );

  const videoPeers = useMemo(
    () => mergedPeers.filter((p) => p.stream.getVideoTracks().length > 0),
    [mergedPeers]
  );

  const audioOnlyPeers = useMemo(
    () =>
      mergedPeers.filter(
        (p) =>
          p.stream.getVideoTracks().length === 0 &&
          p.stream.getAudioTracks().length > 0
      ),
    [mergedPeers]
  );

  const remoteCount = videoPeers.length;

  console.log({ videoPeers });

  return (
    <div>
      <div className="relative min-h-screen bg-gray-100 dark:bg-gray-800">
        {/* Play audio for peers who have audio but no video (no visual tile) */}
        {audioOnlyPeers.map(({ peerId, stream }) => (
          <AudioSink key={`audio-${peerId}`} stream={stream} />
        ))}
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-28">
          {/* Single remote -> full screen */}
          {remoteCount === 1 ? (
            <VideoTile
              key={remoteTiles[0].peerId}
              stream={remoteTiles[0].stream}
              label={remoteTiles[0].userName || "Participant"}
              className="w-full h-[calc(100vh-9rem)] rounded-xl shadow-lg"
            />
          ) : (
            // Grid of remotes: up to 3 per row, then wrap
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {videoPeers.map((tile) => (
                <div
                  key={tile.peerId}
                  className="w-full rounded-xl overflow-hidden shadow-lg"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <VideoTile
                    stream={tile.stream}
                    className="w-full h-full"
                    label={
                      remoteTiles?.length > 0
                        ? remoteTiles.find((t) => t.peerId === tile.peerId)
                            ?.userName
                        : "Participant"
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4">
          <VideoTile
            key="local"
            stream={localStream}
            mirror
            muted
            label="You"
            className="w-[250px] h-auto border-4 border-white dark:border-gray-900 rounded-xl shadow-lg"
          />
        </div>

        {/* CONTROLS */}
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={() => client?.leave()}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
          >
            Leave
          </button>

          <button
            onClick={() => {
              const ls = client?.getLocalStream();
              const track = ls?.getVideoTracks()[0];
              if (track) track.enabled = !track.enabled;
              if (track && !track.enabled) console.log("camera off");
            }}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white"
          >
            Toggle Camera
          </button>

          <button
            onClick={() => {
              const ls = client?.getLocalStream();
              const track = ls?.getAudioTracks()[0];
              if (track) track.enabled = !track.enabled;
            }}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white"
          >
            Mute/Unmute
          </button>
        </footer>
      </div>
      {/* <footer className="mt-4 flex gap-3 absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={() => client?.leave()}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500"
        >
          Leave
        </button>

        <button
          onClick={async () => {
            // toggle camera
            const ls = client?.getLocalStream();
            const track = ls?.getVideoTracks()[0];
            if (track) track.enabled = !track.enabled;
            track && !track.enabled && console.log("camera off");
          }}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
        >
          Toggle Camera
        </button>

        <button
          onClick={async () => {
            const ls = client?.getLocalStream();
            const track = ls?.getAudioTracks()[0];
            if (track) track.enabled = !track.enabled;
          }}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
        >
          Mute/Unmute
        </button>
      </footer> */}
    </div>
  );
};

export default Page;
