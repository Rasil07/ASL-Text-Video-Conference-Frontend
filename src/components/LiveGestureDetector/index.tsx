"use client";
import { useEffect, useRef, useState } from "react";

import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";

type Props = { handLandmarker: HandLandmarker };

type GestureHit = { label: string; confidence: number; t: number };

export default function WebcamSentenceGestures({ handLandmarker }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hits, setHits] = useState<GestureHit[]>([]);
  const [isStreamActive, setIsStreamActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let rafId = 0;

    const startCamera = async () => {
      try {
        console.log("Starting camera...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        if (!videoRef.current || cancelled) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsStreamActive(true);
        console.log("Camera started successfully");

        // Wait for video metadata to load
        await new Promise<void>((res) => {
          if (!videoRef.current || cancelled) return res();
          if (videoRef.current.readyState >= 2) return res();
          videoRef.current.onloadedmetadata = () => res();
        });

        if (cancelled) return;

        // Set canvas dimensions to match video
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          console.log(
            `Canvas dimensions set to: ${canvasRef.current.width}x${canvasRef.current.height}`
          );
        }

        // Get drawing context
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) {
          console.error("Failed to get canvas context");
          return;
        }

        const draw = new DrawingUtils(ctx);
        let lastUi = 0;

        // Detection loop
        const loop = () => {
          if (cancelled || !videoRef.current || !ctx || !canvasRef.current)
            return;

          if (
            videoRef.current.videoWidth === 0 ||
            videoRef.current.videoHeight === 0
          ) {
            rafId = requestAnimationFrame(loop);
            return;
          }

          const now = performance.now();
          const result = handLandmarker.detectForVideo(videoRef.current, now);

          // Debug: Log detection results
          if (result?.landmarks && result.landmarks.length > 0) {
            console.log(`Detected ${result.landmarks.length} hand(s)`);
          }

          // Clear canvas
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          // Draw landmarks for each detected hand
          result?.landmarks?.forEach((lm, index) => {
            console.log(`Drawing landmarks for hand ${index + 1}`);

            if (draw) {
              // Draw hand landmarks
              draw.drawLandmarks(lm, {
                radius: 3,
                color: "#00FF00",
                fillColor: "#00FF00",
              });

              // Draw hand connections
              draw.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 2,
              });
            }

            // Gesture recognition
            const openPalm = lm[8].y < lm[6].y && lm[12].y < lm[10].y;
            const fist = lm[8].y > lm[6].y && lm[12].y > lm[10].y;
            const thumbUp = lm[4].y < lm[3].y && lm[8].y > lm[6].y;

            let detectedLabel: string | null = null;
            if (openPalm) detectedLabel = "HELLO";
            else if (fist) detectedLabel = "YES";
            else if (thumbUp) detectedLabel = "THANK_YOU";

            if (detectedLabel && now - lastUi > 500) {
              lastUi = now;
              setHits((prev) => [
                { label: detectedLabel!, confidence: 0.9, t: Date.now() },
                ...prev.slice(0, 9),
              ]);
            }
          });

          rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      console.log("Cleaning up camera...");
      cancelled = true;

      // Cancel animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      // Stop all tracks in the stream
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        stream = null;
      }

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsStreamActive(false);
      console.log("Camera cleanup completed");
    };
  }, [handLandmarker]);

  // Additional cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, ensuring camera cleanup...");
      // This will run when the component unmounts
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Gesture hits display */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Detected Gestures:</h3>
        <div className="flex flex-wrap gap-2">
          {hits.length === 0 ? (
            <p className="text-gray-500">Make hand gestures to see results</p>
          ) : (
            hits.map((hit) => (
              <div
                key={hit.t}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
              >
                {hit.label}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Video and Canvas Container */}
      <div className="relative">
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
          className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      {/* Camera Status */}
      <div className="mt-2 text-center">
        <span
          className={`inline-block px-2 py-1 rounded text-sm ${
            isStreamActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isStreamActive ? "Camera Active" : "Camera Inactive"}
        </span>
      </div>
    </div>
  );
}
