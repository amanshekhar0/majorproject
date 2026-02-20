import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
    initialSeconds: number;
    onExpire?: () => void;
}

export const useTimer = ({ initialSeconds, onExpire }: UseTimerOptions) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const expiredRef = useRef(false);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);
    const stop = useCallback(() => {
        setIsRunning(false);
        setSecondsLeft(0);
    }, []);

    const getElapsedSeconds = useCallback(() => initialSeconds - secondsLeft, [initialSeconds, secondsLeft]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        if (!expiredRef.current) {
                            expiredRef.current = true;
                            onExpire?.();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, onExpire]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const urgency = secondsLeft < 300 ? 'critical' : secondsLeft < 600 ? 'warning' : 'normal';

    return { secondsLeft, isRunning, start, pause, stop, formatTime, urgency, getElapsedSeconds };
};
