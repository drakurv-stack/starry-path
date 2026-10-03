import type { RefObject } from "react";
import type { VitalLensFaceBox } from "@/lib/vitallens-face-detector";

export type FaceSignalStatus = "SEARCHING" | "CALIBRATING" | "TRACKING" | "SIGNAL WEAK";

interface FaceSignalOverlayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  faceBox: VitalLensFaceBox | null;
  bpm: number | null;
  fps: number;
  status: FaceSignalStatus;
}

export function drawFaceWaveform(canvas: HTMLCanvasElement | null, values: number[]) {
  if (!canvas) return;

  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(bounds.width * pixelRatio);
  const pixelHeight = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);

  const trace = values.slice(-150);
  if (trace.length < 2) return;

  const min = Math.min(...trace);
  const max = Math.max(...trace);
  const range = max - min;
  if (!Number.isFinite(range) || range < 1e-12) return;

  const inset = 4;
  const width = bounds.width - inset * 2;
  const height = bounds.height - inset * 2;
  const middle = inset + height / 2;

  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(inset, middle);
  context.lineTo(bounds.width - inset, middle);
  context.stroke();

  context.strokeStyle = "#fb7185";
  context.lineWidth = 1.75;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  trace.forEach((value, index) => {
    const x = inset + (index / (trace.length - 1)) * width;
    const y = inset + (1 - (value - min) / range) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

export function FaceSignalOverlay({ canvasRef, faceBox, bpm, fps, status }: FaceSignalOverlayProps) {
  const statusClass = status === "TRACKING"
    ? "text-emerald-200"
    : status === "SIGNAL WEAK" || status === "SEARCHING"
      ? "text-amber-200"
      : "text-white/80";
  const faceStyle = faceBox
    ? {
        left: `${faceBox.x * 100}%`,
        top: `${faceBox.y * 100}%`,
        width: `${faceBox.width * 100}%`,
        height: `${faceBox.height * 100}%`,
      }
    : { left: "11%", top: "6%", width: "78%", height: "88%" };
  const roiStyle = faceBox
    ? {
        left: `${(faceBox.x + faceBox.width * 0.28) * 100}%`,
        top: `${(faceBox.y + faceBox.height * 0.1) * 100}%`,
        width: `${faceBox.width * 0.44 * 100}%`,
        height: `${faceBox.height * 0.2 * 100}%`,
      }
    : null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute border-2 ${faceBox ? "border-rose-500" : "border-dashed border-rose-300/80"}`}
        style={faceStyle}
      >
        {!faceBox && (
          <span className="absolute left-0 top-0 rounded-br bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-rose-100">
            SEARCHING FOR FACE
          </span>
        )}
      </div>
      {roiStyle && (
        <div className="absolute border border-emerald-300" style={roiStyle}>
          <span className="absolute left-0 top-0 rounded-br bg-black/70 px-1 py-0.5 text-[8px] font-semibold tracking-wide text-emerald-100">
            POS ROI
          </span>
        </div>
      )}

      {faceBox && (
        <>
          <span
            className="absolute -translate-y-full whitespace-nowrap text-sm font-bold tabular-nums text-rose-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{ left: `${faceBox.x * 100}%`, top: `${Math.max(8, faceBox.y * 100)}%` }}
          >
            {bpm === null ? "--" : bpm} bpm
          </span>
          <span
            className="absolute whitespace-nowrap text-xs font-semibold tabular-nums text-emerald-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{ left: `${faceBox.x * 100}%`, top: `${Math.min(93, (faceBox.y + faceBox.height) * 100 + 0.5)}%` }}
          >
            {fps.toFixed(2)} fps
          </span>
        </>
      )}

      <div className="absolute right-2 top-2">
        <span className={`rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold tracking-wide ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="absolute right-[3%] top-[28%] h-[42%] w-[29%] rounded-md bg-black/10">
        <span className="absolute -top-4 left-0 text-[8px] font-semibold tracking-wide text-white/80 drop-shadow">
          POS
        </span>
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </div>
  );
}