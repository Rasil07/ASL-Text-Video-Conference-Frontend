/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SFUClient, ID, MediaKind } from "@/lib/sfuClient";
import { useEffect, useMemo, useRef, useState } from "react";

type MeetingRoomProps = {
  code: string;
};
export const useMeetingRoom = ({ code }: MeetingRoomProps) => {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "joined" | "error"
  >("idle");
  const [error, setError] = useState<string>("");
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteTiles, setRemoteTiles] = useState<
    Array<{
      peerId: ID;
      kind: MediaKind;
      stream: MediaStream;
      producerId: ID;
      consumerId: ID;
      userName?: string;
      userEmail?: string;
    }>
  >([]);

  console.log("remoteTiles", remoteTiles);

  const clientRef = useRef<SFUClient>(null);

  const client = useMemo(
    () =>
      new SFUClient({
        onConnected: () => {},
        onError: (e) => {
          setError(String(e));
          setStatus("error");
        },
        onPeerJoined: (peer) => {
          console.log("Peer joined:", peer);
        },

        onNewRemoteTrack: ({
          peerId,
          kind,
          stream,
          producerId,
          consumerId,
          userEmail,
          userName,
        }) => {
          console.log("New remote track:", {
            peerId,
            kind,
            stream,
            producerId,
            consumerId,
            userEmail,
            userName,
          });
          setRemoteTiles((prev) => {
            // avoid duplicates
            const exists = prev.some((t) => t.consumerId === consumerId);
            if (exists) return prev;
            return [
              ...prev,
              {
                peerId,
                kind,
                stream,
                producerId,
                consumerId,
                userEmail,
                userName,
              },
            ];
          });
        },
        onRemoteTrackClosed: (producerId) => {
          setRemoteTiles((prev) =>
            prev.filter((t) => t.producerId !== producerId)
          );
        },
        onPeerLeft: (peerId) => {
          setRemoteTiles((prev) => prev.filter((t) => t.peerId !== peerId));
        },
      }),
    []
  );

  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatus("connecting");
        // 1) connect socket
        await client.connect();

        // 3) join room
        await client.join(code);

        // 4) get local media and attach
        const stream = await client.enableCameraAndMic();

        console.log("got local stream", stream);
        if (!mounted) return;
        setLocalStream(stream);

        await client.startProducing();
        setStatus("joined");
      } catch (e: any) {
        console.error("Error caught", e);
        setError(e?.message || String(e));
        setStatus("error");
      }
    })();
    return () => {
      mounted = false;

      // client.leave().catch(()=>{});
    };
  }, [code]);

  return {
    status,
    error,
    localStream,
    remoteTiles,
    client: clientRef.current,
  };
};
// Query keys
