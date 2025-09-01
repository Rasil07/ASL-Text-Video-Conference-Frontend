"use client";
import { useEffect, useRef, useState } from "react";

import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
// import type { HandLandmarker } from "@mediapipe/tasks-vision";

type Props = { handLandmarker: HandLandmarker };
// ---- simple token type just to show results in UI ----
type GestureHit = { label: string; confidence: number; t: number };

const DEFAULT__VIDEO_CONFIG = {
  enableVideo: true,
  enableAudio: true,
  videoConfig: { width: 640, height: 480, facingMode: "user" },
};

export default function WebcamSentenceGestures({ handLandmarker }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoConfig, setVideoConfig] = useState<typeof DEFAULT__VIDEO_CONFIG>(
    DEFAULT__VIDEO_CONFIG
  );

  const [hits, setHits] = useState<GestureHit[]>([]); // throttled UI log
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let rafId = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});

        await new Promise<void>((res) => {
          if (!videoRef.current) return res();
          if (videoRef.current.readyState >= 2) return res();
          videoRef.current.onloadedmetadata = () => res();
        });
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        // 4) overlay ctx + utils
        const ctx = canvasRef.current?.getContext("2d") ?? undefined;
        const draw = ctx ? new DrawingUtils(ctx) : null;

        // throttle UI logs to max ~2/sec
        let lastUi = 0;

        // 5) detection loop (runs only when video dimensions are valid)
        const loop = () => {
          if (cancelled || !videoRef.current) return;

          if (
            videoRef.current.videoWidth === 0 ||
            videoRef.current.videoHeight === 0
          ) {
            rafId = requestAnimationFrame(loop);
            return;
          }

          const now = performance.now();
          const result = handLandmarker.detectForVideo(videoRef.current, now);

          if (ctx && canvasRef.current) {
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }

          // draw + classify for each detected hand
          result?.landmarks?.forEach((lm) => {
            // draw overlay (optional; remove this block to hide landmarks)
            if (draw) {
              draw.drawLandmarks(lm, { radius: 2 });
              draw.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS);
            }

            // ---- placeholder gesture recognition (replace with your model) ----
            // open palm (index+middle extended) -> HELLO
            const openPalm = lm[8].y < lm[6].y && lm[12].y < lm[10].y;
            // fist (index+middle curled) -> YES
            const fist = lm[8].y > lm[6].y && lm[12].y > lm[10].y;
            // thumbs-up (thumb extended while index curled) -> THANK_YOU
            const thumbUp = lm[4].y < lm[3].y && lm[8].y > lm[6].y;

            let label: string | null = null;
            if (openPalm) label = "HELLO";
            else if (fist) label = "YES";
            else if (thumbUp) label = "THANK_YOU";

            if (label && now - lastUi > 500) {
              // throttle UI updates
              lastUi = now;
              setHits((prev) => [
                { label, confidence: 0.9, t: Date.now() },
                ...prev.slice(0, 9),
              ]);
            }
          });

          rafId = requestAnimationFrame(loop);
        };

        // start loop after dimensions are valid
        rafId = requestAnimationFrame(loop);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [handLandmarker]);

  return (
    <div>
      {hits.map((hit) => (
        <div key={hit.t}>{hit.label}</div>
      ))}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg bg-black"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        suppressHydrationWarning
      />
    </div>
  );
}
