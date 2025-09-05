"use client";

import LiveGestureDetector from "@/components/LiveGestureDetector";
import { loadHandLandmarker } from "@/lib/mediaLoader";
import { HandLandmarker } from "@mediapipe/tasks-vision";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );
  const { logout } = useAuth();

  useEffect(() => {
    loadHandLandmarker().then((handLandmarker) => {
      setHandLandmarker(handLandmarker);
    });
  }, []);

  const handleLogout = () => {
    logout();
    // The AuthContext will handle the redirect
  };

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-xl font-semibold">Live Gesture Detector (MVP)</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex items-center justify-center">
        {handLandmarker && (
          <LiveGestureDetector handLandmarker={handLandmarker} />
        )}
      </div>

      <footer className="flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
