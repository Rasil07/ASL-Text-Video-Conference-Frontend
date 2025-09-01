"use client";
import { useEffect, useRef, useState } from "react";

type GestureResult = { label: string; confidence: number; t: number };

export default function WebcamWithGestures() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gestures, setGestures] = useState<GestureResult[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream;

    const MODEL_URL =
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
    const WASM_BASE =
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm";

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Load MediaPipe
        const mp = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, HandLandmarker, DrawingUtils } = mp;

        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numHands: 2,
        });

        const ctx = canvasRef.current?.getContext("2d");
        const drawingUtils = ctx ? new DrawingUtils(ctx) : null;

        setReady(true);

        const loop = () => {
          if (cancelled || !videoRef.current) return;
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

          result?.landmarks?.forEach((lm) => {
            if (drawingUtils) {
              drawingUtils.drawLandmarks(lm, { radius: 2 });
              drawingUtils.drawConnectors(
                lm,
                mp.HandLandmarker.HAND_CONNECTIONS
              );
            }

            // === Placeholder gesture classifier ===
            const openPalm = isOpenPalm(lm);
            const fist = isFist(lm);
            const thumbUp = isThumbUp(lm);

            let label: string | null = null;
            if (openPalm) label = "HELLO";
            else if (fist) label = "YES";
            else if (thumbUp) label = "THANK_YOU";

            if (label) {
              setGestures((prev) => [
                { label, confidence: 0.9, t: Date.now() },
                ...prev.slice(0, 9),
              ]);
            }
          });

          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      } catch (err) {
        console.error("Init error:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative w-full max-w-[680px]">
      <div className="relative">
        {/* Mirrored preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg bg-black"
          style={{ transform: "scaleX(-1)" }}
          suppressHydrationWarning
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (canvasRef.current) {
              canvasRef.current.width = v.videoWidth;
              canvasRef.current.height = v.videoHeight;
            }
          }}
        />
        {/* Mirrored overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Loading model…
          </div>
        )}
      </div>

      <div className="mt-3 p-3 border rounded-lg">
        <h2 className="font-semibold text-sm mb-2">Detected Gestures:</h2>
        <ul className="text-sm space-y-1">
          {gestures.map((g, i) => (
            <li key={i}>
              {g.label} ({g.confidence}) – {new Date(g.t).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* === Simple heuristics for placeholder gestures === */
function isOpenPalm(lm: any[]) {
  return lm[8].y < lm[6].y && lm[12].y < lm[10].y;
}
function isFist(lm: any[]) {
  return lm[8].y > lm[6].y && lm[12].y > lm[10].y;
}
function isThumbUp(lm: any[]) {
  return lm[4].y < lm[3].y && lm[8].y > lm[6].y;
}
