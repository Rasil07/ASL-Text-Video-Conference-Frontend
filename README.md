# ASL Text Video Conference — Frontend

A Next.js (App Router) frontend for real-time video conferencing with ASL/text-first UX. It provides multi-peer video tiles, audio-only handling, and basic meeting controls.

## Tech Stack

- Next.js 14+ (React, App Router)
- TypeScript
- Tailwind CSS
- WebRTC (MediaStream APIs)
- Context/Custom Hooks (AuthContext, useMeetingRoom)

## Key Features

- Join meeting by code (route: /meeting/[code])
- Local preview with mirror and mute
- Remote participants grid with responsive layout
- Audio-only peers handled via hidden audio sinks
- Basic controls: Leave, Toggle Camera, Mute/Unmute
- Track merging per peer (single combined audio/video stream per peer)

## Project Structure (selected)

- src/app/(protected)/meeting/[code]/page.tsx — meeting UI
- src/components/Meeting/VideoTile.tsx — media tile component
- src/hooks/useMeetingRoom.ts — meeting client, media and signaling
- src/contexts/AuthContext.tsx — authentication context/provider
- tailwind.config.js, postcss.config.js, src/styles/globals.css — styling

## Prerequisites

- Node.js 18+ and npm 9+
- Modern browser with camera/microphone
- Running signaling/media backend compatible with useMeetingRoom

## Environment Variables (.env.local)

Adjust to your backend/signaling:

- NEXT_PUBLIC_API_BASE_URL=https://api.example.com
- NEXT_PUBLIC_SIGNALING_URL=wss://signal.example.com
- NEXT_PUBLIC_TURN_URL=turns:turn.example.com:5349 (optional)
- NEXT_PUBLIC_TURN_USERNAME=...
- NEXT_PUBLIC_TURN_PASSWORD=...
- AUTH\_... (as required by your Auth provider, if applicable)

Create .env.local at repo root and populate the above.

## Setup

- npm install
- npm run dev
- Open http://localhost:3000

## Build & Run

- Production build: npm run build
- Start: npm start

## Linting

- npm run lint (if configured)

## Usage

- Navigate to /meeting/<roomCode>
- Allow camera and microphone permissions
- Controls:
  - Leave: disconnects from the room
  - Toggle Camera: enables/disables local video track
  - Mute/Unmute: enables/disables local audio track

## Core Concepts

- VideoTile: Renders MediaStream, supports mirror, mute, and label
- useMeetingRoom(code):
  - status: "connecting" | "connected" | "disconnected" | ...
  - error: string | null
  - localStream: MediaStream | undefined
  - remoteTiles: Array<{ peerId, stream, kind: "audio" | "video", producerId, consumerId, userName?, userEmail? }>
  - client:
    - getLocalStream(): MediaStream | undefined
    - leave(): void
- AudioSink: Plays audio for audio-only peers without rendering a video tile
- Stream merge: Audio and video tracks per peer are merged into a single MediaStream for consistent UI

## Styling

- Tailwind CSS utility classes for responsive grid and theming (light/dark)
- Aspect ratios maintained for tiles (16:9)

## Accessibility

- Use system/browser-level mic and camera controls when needed
- Provide user labels for tiles (userName fallback to "Participant")

## Security & Privacy

- Serve over HTTPS to access camera/microphone
- Do not commit secrets; use .env.local
- Inform users about recording policies if enabled server-side

## Deployment

- Vercel or any Node-compatible host
- Set environment variables in the hosting platform
- Ensure signaling/media servers are reachable from the deployed origin

## Troubleshooting

- No video/audio:
  - Verify browser permissions and HTTPS
  - Confirm signaling URL and backend reachability
- Black tile or frozen video:
  - Check track enabled state and network conditions
- Echo or feedback:
  - Use headphones; avoid open speakers and mic in the same room

## Contributing

- Create a branch, follow conventional commits, open a PR
- Keep hooks/components typed and cohesive; avoid side effects in render
- Test across Chromium and WebKit-based browsers

## License

- Specify license for this project (e.g., MIT) in a LICENSE file.
