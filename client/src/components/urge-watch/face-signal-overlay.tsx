import type { RefObject } from "react";

export type FaceSignalStatus = "CALIBRATING" | "TRACKING" | "SIGNAL WEAK";

interface FaceSignalOverlayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
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

export function FaceSignalOverlay({ canvasRef, bpm, fps, status }: FaceSignalOverlayProps) {
  const statusClass = status === "TRACKING"
    ? "text-emerald-200"
    : status === "SIGNAL WEAK"
      ? "text-amber-200"
      : "text-white/80";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[11%] top-[6%] h-[88%] w-[78%] rounded-[2.5rem] border-2 border-rose-400/90">
        <span className="absolute left-0 top-0 rounded-br bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-rose-200">
          FACE GUIDE
        </span>
      </div>
      <div className="absolute left-1/4 top-1/6 h-2/3 w-1/2 border-2 border-emerald-300/90">
        <span className="absolute left-0 top-0 rounded-br bg-black/70 px-1 py-0.5 text-[8px] font-semibold tracking-wide text-emerald-100">
          POS ROI
        </span>
      </div>

      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
        <span className={`rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold tracking-wide ${statusClass}`}>
          {status}
        </span>
        <span className="rounded-md bg-black/70 px-2 py-1 text-right text-[9px] font-semibold tabular-nums text-white">
          {bpm === null ? "--" : bpm} BPM <span className="text-white/65">· {fps} FPS</span>
        </span>
      </div>

      <div className="absolute inset-x-2 bottom-2 rounded-lg border border-white/10 bg-black/75 px-2 pb-1.5 pt-1">
        <div className="text-[8px] font-semibold tracking-[0.12em] text-white/65">LIVE POS SIGNAL · ON DEVICE</div>
        <canvas ref={canvasRef} className="mt-0.5 block h-8 w-full" />
      </div>
    </div>
  );
}