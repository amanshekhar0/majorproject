import { useEffect, useRef, useState, useCallback } from "react";

export type WarningType = "tab" | "presence" | null;
export type PresenceReason = "missing" | "multiple" | null;

interface UseAntiCheatOptions {
  onTerminate: () => void;
  onTabSwitch: () => void;
  onPresenceIssue?: (reason: PresenceReason) => void;
  onNoiseAlert?: () => void;
  enabled: boolean;
  tabSwitchCount: number;
  MAX_TAB_SWITCHES?: number;
}

const FACE_ABSENT_MS = 3000;
const FACE_MULTI_MS = 3000;
const FACE_ISSUE_COOLDOWN_MS = 55_000;
const NOISE_RMS_THRESHOLD = 0.14;
const NOISE_HOLD_MS = 7000;
const NOISE_ALERT_COOLDOWN_MS = 45_000;

export const useAntiCheat = ({
  onTerminate,
  onTabSwitch,
  onPresenceIssue,
  onNoiseAlert,
  enabled,
  tabSwitchCount,
  MAX_TAB_SWITCHES = 5,
}: UseAntiCheatOptions) => {
  const [warningType, setWarningType] = useState<WarningType>(null);
  const [presenceReason, setPresenceReason] = useState<PresenceReason>(null);
  const [isTerminated, setIsTerminated] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [, setNoiseWatching] = useState(false); // reactive flag for badge if needed later

  const videoRefUsed = useRef<HTMLVideoElement | null>(null);
  const faceDetectorRef = useRef<{
    detectForVideo: (
      v: HTMLVideoElement,
      ts: number,
    ) => { detections?: unknown[] };
  } | null>(null);
  const animFaceRef = useRef<number | null>(null);

  const absenceStartRef = useRef<number | null>(null);
  const multiStartRef = useRef<number | null>(null);
  const lastPresenceIssueRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const noiseHighSinceRef = useRef<number | null>(null);
  const lastNoiseAlertRef = useRef<number>(0);
  const animNoiseRef = useRef<number | null>(null);

  const onTerminateRef = useRef(onTerminate);
  const onTabSwitchRef = useRef(onTabSwitch);
  const onPresenceIssueRef = useRef(onPresenceIssue);
  const onNoiseAlertRef = useRef(onNoiseAlert);
  onTerminateRef.current = onTerminate;
  onTabSwitchRef.current = onTabSwitch;
  onPresenceIssueRef.current = onPresenceIssue;
  onNoiseAlertRef.current = onNoiseAlert;

  // Tab / visibility
  useEffect(() => {
    if (!enabled) return;

    const handleFocusLoss = () => {
      onTabSwitchRef.current();
      setWarningType("tab");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleFocusLoss();
    };

    window.addEventListener("blur", handleFocusLoss);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleFocusLoss);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (tabSwitchCount >= MAX_TAB_SWITCHES) {
      setIsTerminated(true);
      onTerminateRef.current();
    }
  }, [tabSwitchCount, enabled, MAX_TAB_SWITCHES]);

  const firePresence = useCallback((reason: Exclude<PresenceReason, null>) => {
    const now = Date.now();
    if (now - lastPresenceIssueRef.current < FACE_ISSUE_COOLDOWN_MS) return;
    lastPresenceIssueRef.current = now;
    setPresenceReason(reason);
    setWarningType("presence");
    onPresenceIssueRef.current?.(reason);
  }, []);

  const initFaceDetectorLoop = useCallback(
    async (videoEl: HTMLVideoElement) => {
      try {
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const resolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        const detector = await FaceDetector.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
        });
        faceDetectorRef.current = detector;

        const tick = () => {
          if (!enabled || !videoEl || videoEl.readyState < 2) {
            animFaceRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const fd = faceDetectorRef.current;
            const res = fd?.detectForVideo(videoEl, performance.now());
            const count = Array.isArray(res?.detections)
              ? res.detections!.length
              : 0;
            const now = performance.now();

            if (count === 0) {
              multiStartRef.current = null;
              if (absenceStartRef.current == null)
                absenceStartRef.current = now;
              else if (
                absenceStartRef.current != null &&
                now - absenceStartRef.current >= FACE_ABSENT_MS
              ) {
                firePresence("missing");
                absenceStartRef.current = null;
              }
            } else if (count > 1) {
              absenceStartRef.current = null;
              if (multiStartRef.current == null) multiStartRef.current = now;
              else if (
                multiStartRef.current != null &&
                now - multiStartRef.current >= FACE_MULTI_MS
              ) {
                firePresence("multiple");
                multiStartRef.current = null;
              }
            } else {
              absenceStartRef.current = null;
              multiStartRef.current = null;
            }
          } catch {
            // ignore transient CV errors
          }
          animFaceRef.current = requestAnimationFrame(tick);
        };
        animFaceRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.warn("FaceDetector unavailable:", e);
      }
    },
    [enabled, firePresence],
  );

  const initWebcam = useCallback(async (videoEl: HTMLVideoElement) => {
    try {
      setCameraBlocked(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      videoRefUsed.current = videoEl;
      videoEl.srcObject = stream;

      const play = async () => {
        try {
          await videoEl.play();
        } catch {
          /* autoplay quirks */
        }
      };
      if (videoEl.readyState >= 1) await play();
      else videoEl.onloadedmetadata = () => play();
      return true;
    } catch (err) {
      console.warn("Webcam access:", err);
      setCameraBlocked(true);
      return false;
    }
  }, []);

  const initGazeDetection = useCallback(
    async (videoEl: HTMLVideoElement) => {
      await initFaceDetectorLoop(videoEl);
    },
    [initFaceDetectorLoop],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        audioStreamRef.current = stream;
        const AudioContextCtor =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext;
        const ctx = new AudioContextCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
        setNoiseWatching(true);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const noiseLoop = () => {
          if (!enabled || !analyserRef.current) {
            animNoiseRef.current = requestAnimationFrame(noiseLoop);
            return;
          }
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const t = performance.now();

          if (rms >= NOISE_RMS_THRESHOLD) {
            if (noiseHighSinceRef.current == null)
              noiseHighSinceRef.current = t;
            else if (t - noiseHighSinceRef.current >= NOISE_HOLD_MS) {
              const now = Date.now();
              if (now - lastNoiseAlertRef.current >= NOISE_ALERT_COOLDOWN_MS) {
                lastNoiseAlertRef.current = now;
                onNoiseAlertRef.current?.();
              }
              noiseHighSinceRef.current = null;
            }
          } else {
            noiseHighSinceRef.current = null;
          }

          animNoiseRef.current = requestAnimationFrame(noiseLoop);
        };
        animNoiseRef.current = requestAnimationFrame(noiseLoop);
      } catch {
        /* mic denied — skip noise tier */
        setNoiseWatching(false);
      }
    };

    startAudio();

    return () => {
      cancelled = true;
      if (animNoiseRef.current) cancelAnimationFrame(animNoiseRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [enabled]);

  const dismissWarning = useCallback(() => {
    if (warningType === "presence") {
      setWarningType(null);
      setPresenceReason(null);
      return;
    }
    if (warningType === "tab" && tabSwitchCount < MAX_TAB_SWITCHES) {
      setWarningType(null);
    }
  }, [warningType, tabSwitchCount, MAX_TAB_SWITCHES]);

  useEffect(() => {
    return () => {
      if (animFaceRef.current) cancelAnimationFrame(animFaceRef.current);
      if (videoRefUsed.current?.srcObject) {
        const s = videoRefUsed.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
      faceDetectorRef.current = null;
    };
  }, []);

  return {
    warningType,
    presenceReason,
    isTerminated,
    cameraBlocked,
    dismissWarning,
    initWebcam,
    initGazeDetection,
  };
};
