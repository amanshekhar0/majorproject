import { useEffect, useRef, useState, useCallback } from 'react';

export type WarningType = 'gaze' | 'tab' | null;

interface UseAntiCheatOptions {
    onTerminate: () => void;
    onTabSwitch: () => void;
    enabled: boolean;
    tabSwitchCount: number;
    MAX_TAB_SWITCHES?: number;
}

export const useAntiCheat = ({
    onTerminate,
    onTabSwitch,
    enabled,
    tabSwitchCount,
    MAX_TAB_SWITCHES = 5,
}: UseAntiCheatOptions) => {
    const [warningType, setWarningType] = useState<WarningType>(null);
    const [isTerminated, setIsTerminated] = useState(false);
    const gazeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const faceLandmarkerRef = useRef<unknown>(null);
    const animFrameRef = useRef<number | null>(null);
    const gazeOffRef = useRef(false);
    // Keep callbacks in refs so they never become effect dependencies
    const onTerminateRef = useRef(onTerminate);
    const onTabSwitchRef = useRef(onTabSwitch);
    onTerminateRef.current = onTerminate;
    onTabSwitchRef.current = onTabSwitch;

    // Tab switch detection
    useEffect(() => {
        if (!enabled) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                onTabSwitchRef.current();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled]);

    // React to tab switch count changes — only runs when count itself changes
    useEffect(() => {
        if (!enabled) return;
        if (tabSwitchCount >= MAX_TAB_SWITCHES) {
            setIsTerminated(true);
            onTerminateRef.current();
        } else if (tabSwitchCount > 0) {
            setWarningType('tab');
        }
    }, [tabSwitchCount, enabled, MAX_TAB_SWITCHES]);

    // Initialize webcam
    const initWebcam = useCallback(async (videoEl: HTMLVideoElement) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
            });
            videoEl.srcObject = stream;
            videoRef.current = videoEl;
        } catch {
            console.warn('Webcam access denied — anti-cheat gaze detection unavailable.');
        }
    }, []);

    // MediaPipe FaceLandmarker gaze detection
    const initGazeDetection = useCallback(async (videoEl: HTMLVideoElement) => {
        if (!enabled) return;
        try {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            const filesetResolver = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'CPU',
                },
                runningMode: 'VIDEO',
                numFaces: 1,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: true,
            });
            faceLandmarkerRef.current = faceLandmarker;

            const detect = () => {
                if (!videoEl || videoEl.readyState < 2) {
                    animFrameRef.current = requestAnimationFrame(detect);
                    return;
                }
                const results = (faceLandmarker as { detectForVideo: (v: HTMLVideoElement, t: number) => { facialTransformationMatrixes?: Array<{ data: number[] }> } }).detectForVideo(videoEl, performance.now());

                const matrix = results?.facialTransformationMatrixes?.[0]?.data;
                if (matrix) {
                    // Extract rotation — if yaw or pitch is significant, user is looking away
                    const yaw = Math.asin(matrix[2]) * (180 / Math.PI);   // left/right
                    const pitch = Math.atan2(-matrix[6], matrix[10]) * (180 / Math.PI); // up/down
                    const isLookingAway = Math.abs(yaw) > 25 || pitch < -20 || pitch > 20;

                    if (isLookingAway && !gazeOffRef.current) {
                        gazeOffRef.current = true;
                        gazeTimeoutRef.current = setTimeout(() => {
                            if (gazeOffRef.current) setWarningType('gaze');
                        }, 5000);
                    } else if (!isLookingAway && gazeOffRef.current) {
                        gazeOffRef.current = false;
                        if (gazeTimeoutRef.current) clearTimeout(gazeTimeoutRef.current);
                        setWarningType(w => w === 'gaze' ? null : w);
                    }
                } else {
                    // No face detected
                    if (!gazeOffRef.current) {
                        gazeOffRef.current = true;
                        gazeTimeoutRef.current = setTimeout(() => {
                            if (gazeOffRef.current) setWarningType('gaze');
                        }, 5000);
                    }
                }
                animFrameRef.current = requestAnimationFrame(detect);
            };

            // If video is already playing/loaded, start immediately; otherwise wait for data
            if (videoEl.readyState >= 2) {
                detect();
            } else {
                videoEl.onloadeddata = () => detect();
            }
        } catch (err) {
            console.warn('MediaPipe FaceLandmarker init failed:', err);
        }
    }, [enabled]);

    const dismissWarning = useCallback(() => {
        if (warningType !== 'tab' || tabSwitchCount < MAX_TAB_SWITCHES) {
            setWarningType(null);
        }
    }, [warningType, tabSwitchCount, MAX_TAB_SWITCHES]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (gazeTimeoutRef.current) clearTimeout(gazeTimeoutRef.current);
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return { warningType, isTerminated, dismissWarning, initWebcam, initGazeDetection };
};
