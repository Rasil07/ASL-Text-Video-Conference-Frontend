// /components/Meeting/VideoTile.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  stream?: MediaStream;
  /** Mute the element (use true for local/self to avoid echo). */
  muted?: boolean;
  /** Mirror video horizontally (use true for local/self camera). */
  mirror?: boolean;
  /** Small label under the tile (e.g., name or “You”). */
  label?: string;
  /** Optional className overrides for the outer container. */
  className?: string;
};

export default function VideoTile({
  stream,
  muted = false,
  mirror = false,
  label,
  className = "",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasVideo = useMemo(() => !!stream?.getVideoTracks().length, [stream]);
  const hasAudio = useMemo(() => !!stream?.getAudioTracks().length, [stream]);

  // Attach/detach stream to the right element(s)
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;

    // Important for autoplay policies: set muted before assigning srcObject
    if (v) v.muted = muted;

    // If we have a video track, prefer attaching to <video>. Otherwise, use <audio>.
    if (hasVideo && v) {
      v.srcObject = stream || null;
      // Safari sometimes needs an explicit play() call
      const play = async () => {
        try {
          await v.play();
        } catch {
          /* ignore autoplay errors */
        }
      };
      v.onloadedmetadata = play;
      play();
      if (a) a.srcObject = null;
    } else if (!hasVideo && hasAudio && a) {
      a.srcObject = stream || null;
      const play = async () => {
        try {
          await a.play();
        } catch {
          /* ignore */
        }
      };
      a.onloadedmetadata = play;
      play();
      if (v) v.srcObject = null;
    } else {
      // No tracks: clear both
      if (v) v.srcObject = null;
      if (a) a.srcObject = null;
    }

    return () => {
      if (v) v.srcObject = null;
      if (a) a.srcObject = null;
    };
  }, [stream, hasVideo, hasAudio, muted]);

  const onDblClick = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      v.requestFullscreen?.();
    }
  };

  return (
    <div
      className={[
        // Premium card container aligned with dashboard theme
        "text-gray-900 dark:text-white",
        "flex flex-col gap-2 p-2",
        "rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        className,
      ].join(" ")}
    >
      {/* Video surface */}
      <div
        className={[
          "relative aspect-video w-full overflow-hidden rounded-lg",
          "bg-gray-100 dark:bg-gray-800",
          "ring-1 ring-inset ring-gray-200/70 dark:ring-gray-700/70",
          "group",
        ].join(" ")}
      >
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              title="Double-click to toggle fullscreen"
              aria-label={label || "Video"}
              className={[
                "h-full w-full object-cover",
                "transition-transform duration-300 group-hover:scale-[1.01]",
                mirror ? "transform -scale-x-100" : "",
              ].join(" ")}
              onDoubleClick={onDblClick}
            />
            {/* Subtle gradient for potential overlays */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          </>
        ) : hasAudio ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              {/* Speaker icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M11 5L6 9H3v6h3l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 010 7.07M18.07 5.93a9 9 0 010 12.73" />
              </svg>
            </div>
            <span>Audio only</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200/60 dark:bg-gray-700/60">
              {/* User icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <span>No media</span>
          </div>
        )}

        {/* Hidden audio element for audio-only streams */}
        <audio ref={audioRef} hidden />
      </div>

      {label && (
        <div className="px-1">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs leading-5">
            <span className="truncate">{label}</span>
          </span>
        </div>
      )}
    </div>
  );
}
