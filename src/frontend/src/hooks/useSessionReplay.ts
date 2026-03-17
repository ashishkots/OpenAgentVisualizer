import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessionReplay } from '../services/sessionApi';
import type { ReplayEvent } from '../services/sessionApi';

export function useSessionReplay(sessionId: string | null) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['replay', sessionId],
    queryFn: () => getSessionReplay(sessionId!),
    enabled: !!sessionId,
  });

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback((currentSpeed: number) => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      setCursorIndex((prev) => {
        if (prev >= events.length - 1) {
          stopInterval();
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500 / currentSpeed);
  }, [stopInterval, events.length]);

  const play = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    startInterval(speed);
  }, [isPlaying, speed, startInterval]);

  const pause = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
  }, [stopInterval]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying) startInterval(newSpeed); // restart interval at new speed
  }, [isPlaying, startInterval]);

  const seek = useCallback((index: number) => {
    pause();
    setCursorIndex(Math.max(0, Math.min(index, events.length - 1)));
  }, [pause, events.length]);

  const currentEvent: ReplayEvent | null = events[cursorIndex] ?? null;

  return {
    events,
    isLoading,
    cursorIndex,
    isPlaying,
    speed,
    currentEvent,
    play,
    pause,
    seek,
    changeSpeed,
    totalEvents: events.length,
  };
}
