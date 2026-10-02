import { useEffect, useRef, useState } from "react";
import type { Pose, PoseDetector } from "@tensorflow-models/pose-detection";
import {
  Activity,
  Camera,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProfileMetrics } from "@/lib/pose-metrics";
import { REQUIRED_PLANK_SECONDS, REQUIRED_PUSHUPS } from "@shared/movement";

const DETECTION_INTERVAL_MS = 100;

type Exercise = "pushups" | "plank" | "complete";
type CameraPhase = "idle" | "loading" | "ready" | "error" | "complete";

type MovementChallengeProps = {
  onComplete: () => void;
};

export function MovementChallenge({ onComplete }: MovementChallengeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const loopActiveRef = useRef(false);
  const mountedRef = useRef(false);
  const exerciseRef = useRef<Exercise>("pushups");
  const pushupsRef = useRef(0);
  const pushupPhaseRef = useRef<"top" | "down" | "unprimed">("unprimed");
  const hasSeenTopRef = useRef(false);
  const plankStartedAtRef = useRef<number | null>(null);
  const completionNotifiedRef = useRef(false);

  const [exercise, setExercise] = useState<Exercise>("pushups");
  const [pushups, setPushups] = useState(0);
  const [plankSeconds, setPlankSeconds] = useState(0);
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>("idle");
  const [feedback, setFeedback] = useState("Place your camera side-on with your full body in view.");
  const [error, setError] = useState("");

  function stopTracking() {
    loopActiveRef.current = false;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    detectorRef.current?.dispose();
    detectorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopTracking();
    };
  }, []);

  function completeChallenge() {
    if (completionNotifiedRef.current) return;
    completionNotifiedRef.current = true;
    exerciseRef.current = "complete";
    setExercise("complete");
    setPlankSeconds(REQUIRED_PLANK_SECONDS);
    setCameraPhase("complete");
    setFeedback("Both movement tasks are complete.");
    stopTracking();
    onComplete();
  }

  async function startCamera() {
    if (cameraPhase === "loading" || cameraPhase === "ready") return;
    setError("");
    setCameraPhase("loading");
    setFeedback("Requesting camera access…");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access. Try a recent browser over HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("The camera preview could not be started.");
      video.srcObject = stream;
      await video.play();

      setFeedback("Loading the on-device pose model…");
      await Promise.all([
        import("@tensorflow/tfjs-backend-webgl"),
        import("@tensorflow/tfjs-converter"),
      ]);
      const tf = await import("@tensorflow/tfjs-core");
      const poseDetection = await import("@tensorflow-models/pose-detection");
      const backendReady = await tf.setBackend("webgl");
      if (!backendReady) throw new Error("This device could not start the WebGL pose detector.");
      await tf.ready();

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
      );
      if (!mountedRef.current) {
        detector.dispose();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      detectorRef.current = detector;
      loopActiveRef.current = true;
      setCameraPhase("ready");
      setFeedback("Detection is running. Keep your head, hips and heels in view.");

      const detect = async () => {
        const activeDetector = detectorRef.current;
        const activeVideo = videoRef.current;
        if (!loopActiveRef.current || !activeDetector || !activeVideo) return;

        try {
          if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const poses = await activeDetector.estimatePoses(activeVideo, { maxPoses: 1 });
            if (!loopActiveRef.current) return;
            processPose(poses[0]);
          }
        } catch {
          if (!loopActiveRef.current) return;
        pushupPhaseRef.current = "unprimed";
        hasSeenTopRef.current = false;
        plankStartedAtRef.current = null;
        setPlankSeconds(0);
          setError("Pose detection stopped. Restart the camera to try again.");
          setCameraPhase("error");
          stopTracking();
          return;
        }

        if (loopActiveRef.current) {
          timeoutRef.current = window.setTimeout(() => void detect(), DETECTION_INTERVAL_MS);
        }
      };
      void detect();
    } catch (caught) {
      stopTracking();
      if (!mountedRef.current) return;
      setCameraPhase("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Camera or pose detection could not start. Check camera permission and try again.",
      );
      setFeedback("Camera access is required for this daily movement step.");
    }
  }

  function processPose(pose: Pose | undefined) {
    const metrics = pose ? getProfileMetrics(pose) : null;
    if (!metrics) {
      setFeedback("Step back so your side profile, hips and heels are visible.");
      if (exerciseRef.current === "plank") {
        plankStartedAtRef.current = null;
        setPlankSeconds(0);
      } else {
        pushupPhaseRef.current = "unprimed";
        hasSeenTopRef.current = false;
      }
      return;
    }

    if (exerciseRef.current === "pushups") {
      if (metrics.bodyAngle < 145 || metrics.bodyTilt > 40) {
        pushupPhaseRef.current = "unprimed";
        hasSeenTopRef.current = false;
        setFeedback("Keep your shoulders, hips and heels in a straight line.");
        return;
      }

      if (metrics.elbowAngle >= 155) {
        if (pushupPhaseRef.current === "down" && hasSeenTopRef.current) {
          const nextCount = Math.min(REQUIRED_PUSHUPS, pushupsRef.current + 1);
          pushupsRef.current = nextCount;
          setPushups(nextCount);
          if (nextCount >= REQUIRED_PUSHUPS) {
            exerciseRef.current = "plank";
            setExercise("plank");
            pushupPhaseRef.current = "unprimed";
            hasSeenTopRef.current = false;
            plankStartedAtRef.current = null;
            setPlankSeconds(0);
            setFeedback(`Push-ups complete. Hold a straight plank for ${REQUIRED_PLANK_SECONDS} seconds.`);
            return;
          }
        }
        pushupPhaseRef.current = "top";
        hasSeenTopRef.current = true;
        setFeedback("Good position. Lower your chest with control.");
      } else if (metrics.elbowAngle <= 105) {
        if (pushupPhaseRef.current === "top") pushupPhaseRef.current = "down";
        setFeedback("Now press all the way back up.");
      } else {
        setFeedback("Lower a little farther, then press back up.");
      }
      return;
    }

    if (exerciseRef.current === "plank") {
      if (metrics.bodyAngle < 155 || metrics.bodyTilt > 30) {
        plankStartedAtRef.current = null;
        setPlankSeconds(0);
        setFeedback("Adjust until your shoulders, hips and heels form a straight line.");
        return;
      }

      const now = performance.now();
      if (plankStartedAtRef.current === null) plankStartedAtRef.current = now;
      const elapsedSeconds = Math.floor((now - plankStartedAtRef.current) / 1000);
      setPlankSeconds(Math.min(REQUIRED_PLANK_SECONDS, elapsedSeconds));
      setFeedback("Form looks steady. Keep holding your plank.");
      if (elapsedSeconds >= REQUIRED_PLANK_SECONDS) completeChallenge();
    }
  }

  const pushupProgress = (pushups / REQUIRED_PUSHUPS) * 100;
  const plankProgress = (plankSeconds / REQUIRED_PLANK_SECONDS) * 100;
  const isCameraActive = cameraPhase === "loading" || cameraPhase === "ready";

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-white/10 bg-white/5 shadow-xl">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/70">
              Required before check-in
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Movement check</h2>
            <p className="mt-2 text-xs leading-5 text-white/45">
              Complete {REQUIRED_PUSHUPS} push-ups and a {REQUIRED_PLANK_SECONDS}-second plank to finish today’s ritual.
            </p>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            {exercise === "complete" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Activity className="h-5 w-5" />
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Live camera preview for on-device exercise pose detection"
            className={`aspect-video w-full object-cover ${isCameraActive ? "scale-x-[-1]" : "opacity-0"}`}
          />
          {!isCameraActive && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div className="space-y-2 px-6">
                {cameraPhase === "complete" ? (
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
                ) : cameraPhase === "error" ? (
                  <CircleAlert className="mx-auto h-8 w-8 text-amber-300" />
                ) : (
                  <Camera className="mx-auto h-8 w-8 text-white/40" />
                )}
                <p className="text-xs text-white/50">
                  {cameraPhase === "complete"
                    ? "Camera stopped"
                    : cameraPhase === "error"
                      ? "Camera needs attention"
                      : "Camera preview starts when you allow access"}
                </p>
              </div>
            </div>
          )}
          {isCameraActive && cameraPhase === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-black/50">
              <div className="flex items-center gap-2 text-sm text-white">
                <Activity className="h-4 w-4 animate-pulse text-cyan-300" />
                Preparing camera and pose model…
              </div>
            </div>
          )}
          {cameraPhase === "ready" && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              On-device detection
            </div>
          )}
        </div>

        <p className="min-h-10 text-center text-xs leading-5 text-white/55" aria-live="polite">
          {feedback}
        </p>
        {error && (
          <p
            className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border p-4 ${exercise === "pushups" ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Push-ups</span>
              {pushups >= REQUIRED_PUSHUPS && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            </div>
            <p className="mt-2 text-3xl font-black text-white">{pushups}<span className="text-sm text-white/35"> / {REQUIRED_PUSHUPS}</span></p>
            <Progress value={pushupProgress} className="mt-3 h-1.5 bg-white/10" />
          </div>
          <div className={`rounded-2xl border p-4 ${exercise === "plank" ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Plank</span>
              {plankSeconds >= REQUIRED_PLANK_SECONDS && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            </div>
            <p className="mt-2 flex items-baseline gap-1 text-3xl font-black text-white">
              <Timer className="h-5 w-5 text-cyan-300" />
              {plankSeconds}<span className="text-sm text-white/35"> / {REQUIRED_PLANK_SECONDS}s</span>
            </p>
            <Progress value={plankProgress} className="mt-3 h-1.5 bg-white/10" />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-5 text-white/40">
          Set your phone side-on at floor height and keep your full body in frame. Video is processed on this device only and is never saved or uploaded. Stop if you feel pain or dizziness.
        </div>

        {cameraPhase === "idle" || cameraPhase === "error" ? (
          <Button
            type="button"
            onClick={() => void startCamera()}
            className="h-14 w-full rounded-2xl border border-white/20 text-base font-black text-white grad-pill"
          >
            <Camera className="mr-2 h-5 w-5" />
            {cameraPhase === "error" ? "Try camera again" : "Start required movement check"}
          </Button>
        ) : cameraPhase === "loading" ? (
          <Button type="button" disabled className="h-14 w-full rounded-2xl text-base font-black">
            <Activity className="mr-2 h-5 w-5 animate-pulse" />
            Preparing…
          </Button>
        ) : cameraPhase === "ready" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stopTracking();
              setCameraPhase("idle");
              setFeedback("Camera stopped. Restart when you are ready to continue.");
              pushupPhaseRef.current = "unprimed";
              hasSeenTopRef.current = false;
              plankStartedAtRef.current = null;
              setPlankSeconds(0);
            }}
            className="h-12 w-full rounded-2xl border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
          >
            Stop camera
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 py-3 text-sm font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Movement requirement complete
          </div>
        )}
      </CardContent>
    </Card>
  );
}