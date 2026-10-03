import type { InferenceSession } from "onnxruntime-web";

export interface VitalLensFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const MODEL_PATH = "/models/vitallens-face-detector.onnx";
const INPUT_WIDTH = 320;
const INPUT_HEIGHT = 240;
const FACE_SCORE_THRESHOLD = 0.9;

let sessionPromise: Promise<InferenceSession> | null = null;

async function createSession() {
  const ort = await import("onnxruntime-web");
  ort.env.wasm.numThreads = 1;
  return ort.InferenceSession.create(MODEL_PATH, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

export function loadVitalLensFaceDetector() {
  if (!sessionPromise) {
    sessionPromise = createSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

export async function detectVitalLensFace(imageData: ImageData): Promise<VitalLensFaceBox | null> {
  if (imageData.width !== INPUT_WIDTH || imageData.height !== INPUT_HEIGHT) {
    throw new Error(`Face detector expects a ${INPUT_WIDTH}×${INPUT_HEIGHT} image.`);
  }

  const session = await loadVitalLensFaceDetector();
  const ort = await import("onnxruntime-web");
  const inputData = new Float32Array(INPUT_WIDTH * INPUT_HEIGHT * 3);
  const pixels = imageData.data;
  for (let source = 0, target = 0; source < pixels.length; source += 4) {
    inputData[target++] = (pixels[source] - 127) / 128;
    inputData[target++] = (pixels[source + 1] - 127) / 128;
    inputData[target++] = (pixels[source + 2] - 127) / 128;
  }

  const input = new ort.Tensor("float32", inputData, [1, INPUT_HEIGHT, INPUT_WIDTH, 3]);
  const outputMap = await session.run({ [session.inputNames[0]]: input });
  const output = outputMap[session.outputNames[0]];
  const data = output.data;
  const featureCount = output.dims[output.dims.length - 1] ?? 0;
  const anchorCount = output.dims[output.dims.length - 2] ?? 0;
  if (featureCount !== 6 || !anchorCount) {
    throw new Error("VitalLens face detector returned an unsupported output shape.");
  }

  let bestScore = FACE_SCORE_THRESHOLD;
  let bestBox: VitalLensFaceBox | null = null;
  for (let anchor = 0; anchor < anchorCount; anchor++) {
    const offset = anchor * featureCount;
    const score = Number(data[offset + 1]);
    if (score <= bestScore) continue;

    const x1 = Math.max(0, Math.min(1, Number(data[offset + 2])));
    const y1 = Math.max(0, Math.min(1, Number(data[offset + 3])));
    const x2 = Math.max(0, Math.min(1, Number(data[offset + 4])));
    const y2 = Math.max(0, Math.min(1, Number(data[offset + 5])));
    if (x2 - x1 < 0.04 || y2 - y1 < 0.04) continue;

    bestScore = score;
    bestBox = {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      confidence: score,
    };
  }

  return bestBox;
}