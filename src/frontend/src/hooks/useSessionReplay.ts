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

  const play = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCursorIndex((prev) => {
        if (prev >= events.length - 1) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500 / speed);
  }, [isPlaying, events.length, speed]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
  }, []);

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
    setSpeed,
    totalEvents: events.length,
  };
}
