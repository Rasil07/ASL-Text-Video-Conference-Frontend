// lib/mediapipeLoader.ts
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;

export async function loadHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  const WASM_BASE =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm";
  const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return handLandmarker;
}
